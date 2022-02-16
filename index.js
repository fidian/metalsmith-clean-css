const CleanCSS = require('clean-css');
const metalsmithPluginKit = require('metalsmith-plugin-kit');

module.exports = (options = {}) => {
    const {
        cleanCSS: cleanCSSParameters = {},
        files: pattern = '**/*.css',
        sourceMap = false,
        sourceMapInlineSources = false
    } = options;
    let cleanCSS;

    return metalsmithPluginKit.middleware({
        after: () => {
            cleanCSS = null;
        },
        before: (files, metalsmith) => {
            cleanCSS = new CleanCSS({
                ...cleanCSSParameters,
                ...(sourceMap
                    ? {
                          sourceMap,
                          sourceMapInlineSources,
                          rebaseTo:
                              cleanCSSParameters.rebaseTo ||
                              metalsmith._directory
                      }
                    : {}),
                returnPromise: true
            });
        },
        each: (filename, file, files) => {
            const sourceMapFilepath = `${filename}.map`;
            const sourceMapFile = files[sourceMapFilepath] || { contents: '' };

            return cleanCSS
                .minify({
                    [filename]: {
                        styles: file.contents.toString(),
                        sourceMap:
                            file.sourceMap ||
                            sourceMapFile.contents.toString() ||
                            undefined
                    }
                })
                .then((output) => {
                    file.contents = Buffer.from(output.styles);

                    if (sourceMap && output.sourceMap) {
                        const sourceMap = Buffer.from(
                            JSON.stringify(output.sourceMap)
                        );
                        file.sourceMap = sourceMap;
                        sourceMapFile.contents = sourceMap;
                        if (!sourceMapInlineSources) {
                            files[sourceMapFilepath] = sourceMapFile;
                        }
                    }
                });
        },
        match: pattern
    });
};
