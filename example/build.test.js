const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const rimraf = require('rimraf');
const test = require('ava');

const build = path.join(__dirname, 'build');
// Make sure the build is cleaned before/after each test
test.beforeEach((t) => {
    rimraf(build, () => {});
});
test.afterEach.always((t) => {
    rimraf(build, () => {});
});

test.serial('the example should build successfully', (t) => {
    return new Promise((resolve, reject) => {
        execFile(
            'node',
            [path.join(__dirname, 'build.js')],
            { cwd: path.join(__dirname, '..') },
            (error) => {
                if (error) {
                    reject(error);
                }

                fs.lstat(build, (error, stats) => {
                    t.falsy(error);
                    t.true(stats.isDirectory());
                    resolve();
                });
            }
        );
    });
});
