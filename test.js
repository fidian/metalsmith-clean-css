const path = require('path');
const test = require('ava');
const metalsmithCleanCSS = require('.');

function callPlugin(plugin, files) {
    return new Promise((resolve, reject) => {
        plugin(
            files,
            { _directory: path.resolve(__dirname, 'fixture') },
            (errors) => {
                if (errors) {
                    reject(errors);
                }

                resolve();
            }
        );
    });
}

test('metalsmith-clean-css should match any CSS file with the default pattern', (t) => {
    const files = {
        'main.css': {
            contents: Buffer.from('  * { display: none }  ')
        },
        'deep/path/main.css': {
            contents: Buffer.from('  * { display: none }  ')
        }
    };
    return callPlugin(metalsmithCleanCSS(), files).then(() => {
        t.deepEqual(files, {
            'main.css': {
                contents: Buffer.from('*{display:none}')
            },
            'deep/path/main.css': {
                contents: Buffer.from('*{display:none}')
            }
        });
    });
});

test('metalsmith-clean-css should only match the desired CSS files if a pattern is given', (t) => {
    const files = {
        'main.css': {
            contents: Buffer.from('  * { display: none }  ')
        },
        'deep/path/main.css': {
            contents: Buffer.from('  * { display: none }  ')
        }
    };
    return callPlugin(metalsmithCleanCSS({ files: '*.css' }), files).then(
        () => {
            t.deepEqual(files, {
                'main.css': {
                    contents: Buffer.from('*{display:none}')
                },
                'deep/path/main.css': {
                    contents: Buffer.from('  * { display: none }  ')
                }
            });
        }
    );
});

test('metalsmith-clean-css should correctly pass options to clean-css', (t) => {
    const files = {
        'main.css': { contents: Buffer.from('/*! special comment */') }
    };
    return callPlugin(
        metalsmithCleanCSS({
            cleanCSS: { level: { 1: { specialComments: 0 } } }
        }),
        files
    ).then(() => {
        t.deepEqual(files, {
            'main.css': {
                contents: Buffer.from('')
            }
        });
    });
});

test('metalsmith-clean-css should forward clean-css errors', (t) => {
    const files = {
        'main.css': { contents: Buffer.from('@import url(https://not/found);') }
    };
    return callPlugin(
        metalsmithCleanCSS({ cleanCSS: { inline: 'all' } }),
        files
    ).then(
        () => {
            return Promise.reject(new Error('This should error'));
        },
        (errors) => {
            t.true(Array.isArray(errors));
            t.is(errors.length, 1);
        }
    );
});

test('metalsmith-clean-css should not generate source maps by default', (t) => {
    const files = {
        'main.css': { contents: Buffer.from(' * { display: none } ') }
    };
    return callPlugin(metalsmithCleanCSS({}), files).then(() => {
        t.false(Boolean(files['main.css'].sourceMap));
        t.deepEqual(Object.keys(files), ['main.css']);
    });
});

test('metalsmith-clean-css should expose both a `sourceMap` property and a `.map` file', (t) => {
    const files = {
        'main.css': { contents: Buffer.from(' * { display: none } ') }
    };
    return callPlugin(metalsmithCleanCSS({ sourceMap: true }), files).then(
        () => {
            t.true(Boolean(files['main.css'].sourceMap));
            t.deepEqual(Object.keys(files), ['main.css', 'main.css.map']);
        }
    );
});

test('metalsmith-clean-css should not expose a .map when `options.sourceMapInlineSources` is set', (t) => {
    const files = {
        'main.css': { contents: Buffer.from(' * { display: none } ') }
    };
    return callPlugin(
        metalsmithCleanCSS({ sourceMap: true, sourceMapInlineSources: true }),
        files
    ).then(() => {
        t.true(Boolean(files['main.css'].sourceMap));
        t.deepEqual(Object.keys(files), ['main.css']);
    });
});
