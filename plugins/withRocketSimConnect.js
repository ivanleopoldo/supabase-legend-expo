const { withAppDelegate, WarningAggregator } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const methodInvocationDefinition = `@interface RocketSimLoader : NSObject

- (void)loadRocketSimConnect;

@end

@implementation RocketSimLoader

- (void)loadRocketSimConnect {
#if DEBUG
  NSString *frameworkPath = @"/Applications/RocketSim.app/Contents/Frameworks/RocketSimConnectLinker.nocache.framework";
  NSBundle *frameworkBundle = [NSBundle bundleWithPath:frameworkPath];
  NSError *error = nil;

  if (![frameworkBundle loadAndReturnError:&error]) {
    NSLog(@"Failed to load linker framework: %@", error);
    return;
  }

  NSLog(@"RocketSim Connect successfully linked");
#endif
}

@end`;

const methodInvocationBlock = `RocketSimLoader *loader = [[RocketSimLoader alloc] init];
  [loader loadRocketSimConnect];`;

const methodInvocationLineMatcher =
  /-\s*\(BOOL\)\s*application:\s*\(UIApplication\s*\*\s*\)\s*\w+\s+didFinishLaunchingWithOptions:/g;

/** @param {string} appDelegate */
const modifyAppDelegate = (appDelegate) => {
  let contents = appDelegate;

  // Check if the method invocation is already there
  if (contents.includes(methodInvocationBlock)) {
    return contents;
  }

  // Check if the method invocation present in the file
  if (!methodInvocationLineMatcher.test(contents)) {
    WarningAggregator.addWarningIOS(
      'withRocketSimConnect',
      `Unable to determine correct insertion point in AppDelegate.
Skipping RocketSim Connect addition.`
    );
    return contents;
  }

  // Check if the import statement is already there
  if (!appDelegate.includes(methodInvocationDefinition)) {
    contents = mergeContents({
      src: contents,
      anchor: methodInvocationLineMatcher,
      newSrc: methodInvocationDefinition,
      offset: -2,
      tag: 'withRocketSimConnect - definition',
      comment: '//',
    }).contents;
  }

  contents = mergeContents({
    src: contents,
    anchor: methodInvocationLineMatcher,
    newSrc: methodInvocationBlock,
    offset: 2,
    tag: 'withRocketSimConnect - didFinishLaunchingWithOptions',
    comment: '//',
  }).contents;

  return contents;
};

/** @param {import('@expo/config-types').ExpoConfig} config */
const withRocketSimConnect = (config) => {
  return withAppDelegate(config, (config) => {
    if (['objc', 'objcpp'].includes(config.modResults.language)) {
      config.modResults.contents = modifyAppDelegate(config.modResults.contents);
    } else {
      WarningAggregator.addWarningIOS(
        'withRocketSimConnect',
        'Swift AppDelegate files are not supported yet.'
      );
    }
    return config;
  });
};

module.exports = withRocketSimConnect;
