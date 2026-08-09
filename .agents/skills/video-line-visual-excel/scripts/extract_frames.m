#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreImage/CoreImage.h>
#import <ImageIO/ImageIO.h>

static BOOL writeJPEG(CGImageRef image, NSString *path, CGFloat quality) {
    NSURL *url = [NSURL fileURLWithPath:path];
    CGImageDestinationRef dest = CGImageDestinationCreateWithURL((__bridge CFURLRef)url, CFSTR("public.jpeg"), 1, NULL);
    if (!dest) return NO;
    NSDictionary *opts = @{(__bridge NSString *)kCGImageDestinationLossyCompressionQuality: @(quality)};
    CGImageDestinationAddImage(dest, image, (__bridge CFDictionaryRef)opts);
    BOOL ok = CGImageDestinationFinalize(dest);
    CFRelease(dest);
    return ok;
}

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        if (argc < 4) {
            fputs("usage: extract_frames input output_dir manifest.csv [selection.txt|-] [width] [quality]\n", stderr);
            return 2;
        }
        NSString *input = [NSString stringWithUTF8String:argv[1]];
        NSString *outputDir = [NSString stringWithUTF8String:argv[2]];
        NSString *manifest = [NSString stringWithUTF8String:argv[3]];
        CGFloat targetWidth = argc >= 6 ? MAX(32.0, atof(argv[5])) : 92.0;
        CGFloat quality = argc >= 7 ? MIN(1.0, MAX(0.1, atof(argv[6]))) : 0.52;
        [[NSFileManager defaultManager] createDirectoryAtPath:outputDir withIntermediateDirectories:YES attributes:nil error:nil];

        NSMutableSet<NSNumber *> *selected = nil;
        if (argc >= 5 && strcmp(argv[4], "-") != 0) {
            NSString *selectionPath = [NSString stringWithUTF8String:argv[4]];
            NSString *selectionText = [NSString stringWithContentsOfFile:selectionPath encoding:NSUTF8StringEncoding error:nil];
            selected = [NSMutableSet set];
            for (NSString *line in [selectionText componentsSeparatedByCharactersInSet:NSCharacterSet.newlineCharacterSet]) {
                if (line.length > 0) [selected addObject:@(line.integerValue)];
            }
        }

        AVURLAsset *asset = [AVURLAsset URLAssetWithURL:[NSURL fileURLWithPath:input] options:nil];
        __block NSArray<AVAssetTrack *> *videoTracks = nil;
        __block NSError *trackError = nil;
        dispatch_semaphore_t trackSemaphore = dispatch_semaphore_create(0);
        [asset loadTracksWithMediaType:AVMediaTypeVideo completionHandler:^(NSArray<AVAssetTrack *> *tracks, NSError *error) {
            videoTracks = tracks;
            trackError = error;
            dispatch_semaphore_signal(trackSemaphore);
        }];
        dispatch_semaphore_wait(trackSemaphore, DISPATCH_TIME_FOREVER);
        AVAssetTrack *track = videoTracks.firstObject;
        if (!track) {
            fprintf(stderr, "no video track: %s\n", trackError.localizedDescription.UTF8String ?: "unknown error");
            return 3;
        }
        NSError *error = nil;
        AVAssetReader *reader = [[AVAssetReader alloc] initWithAsset:asset error:&error];
        if (!reader) {
            fprintf(stderr, "%s\n", error.localizedDescription.UTF8String);
            return 4;
        }
        NSDictionary *settings = @{(id)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA)};
        AVAssetReaderTrackOutput *output = [[AVAssetReaderTrackOutput alloc] initWithTrack:track outputSettings:settings];
        output.alwaysCopiesSampleData = NO;
        [reader addOutput:output];
        if (![reader startReading]) {
            fprintf(stderr, "%s\n", reader.error.localizedDescription.UTF8String);
            return 5;
        }

        FILE *csv = fopen(manifest.UTF8String, "w");
        if (!csv) return 6;
        fputs("frame,time_seconds,file\n", csv);
        CIContext *context = [CIContext contextWithOptions:@{kCIContextUseSoftwareRenderer: @NO}];
        CGAffineTransform preferred = track.preferredTransform;
        NSInteger frame = 0;
        NSInteger written = 0;

        while (reader.status == AVAssetReaderStatusReading) {
            CMSampleBufferRef sample = [output copyNextSampleBuffer];
            if (!sample) break;
            @autoreleasepool {
                BOOL shouldWrite = !selected || [selected containsObject:@(frame)];
                if (shouldWrite) {
                    CVPixelBufferRef pixel = CMSampleBufferGetImageBuffer(sample);
                    CMTime pts = CMSampleBufferGetPresentationTimeStamp(sample);
                    CIImage *ci = [CIImage imageWithCVPixelBuffer:pixel];
                    ci = [ci imageByApplyingTransform:preferred];
                    CGRect extent = ci.extent;
                    ci = [ci imageByApplyingTransform:CGAffineTransformMakeTranslation(-extent.origin.x, -extent.origin.y)];
                    extent = ci.extent;
                    CGFloat scale = targetWidth / extent.size.width;
                    ci = [ci imageByApplyingTransform:CGAffineTransformMakeScale(scale, scale)];
                    CGRect outRect = CGRectMake(0, 0, floor(extent.size.width * scale), floor(extent.size.height * scale));
                    CGImageRef image = [context createCGImage:ci fromRect:outRect];
                    NSString *name = [NSString stringWithFormat:@"frame_%06ld.jpg", (long)frame];
                    NSString *path = [outputDir stringByAppendingPathComponent:name];
                    if (image && writeJPEG(image, path, quality)) {
                        fprintf(csv, "%ld,%.9f,%s\n", (long)frame, CMTimeGetSeconds(pts), name.UTF8String);
                        written++;
                    }
                    if (image) CGImageRelease(image);
                }
                frame++;
                if (frame % 1000 == 0) fprintf(stderr, "scanned=%ld written=%ld\n", (long)frame, (long)written);
            }
            CFRelease(sample);
        }
        fclose(csv);
        fprintf(stderr, "done scanned=%ld written=%ld status=%ld\n", (long)frame, (long)written, (long)reader.status);
        if (reader.status == AVAssetReaderStatusFailed) {
            fprintf(stderr, "%s\n", reader.error.localizedDescription.UTF8String);
            return 7;
        }
    }
    return 0;
}
