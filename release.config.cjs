module.exports = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { breaking: true, release: 'major' },
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'docs', release: false },
          { type: 'refactor', release: false },
          { type: 'build', release: false },
          { type: 'ci', release: false },
          { type: 'test', release: false },
          { type: 'style', release: false },
          { type: 'chore', release: false },
        ],
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features', hidden: false },
            { type: 'fix', section: 'Bug Fixes', hidden: false },
            {
              type: 'perf',
              section: 'Performance Improvements',
              hidden: false,
            },
            { type: 'refactor', section: 'Refactoring', hidden: false },
            { type: 'docs', section: 'Documentation', hidden: false },
            { type: 'build', section: 'Build System', hidden: false },
            {
              type: 'ci',
              section: 'Continuous Integration',
              hidden: false,
            },
            { type: 'test', section: 'Tests', hidden: false },
            { type: 'style', section: 'Styles', hidden: false },
            { type: 'chore', section: 'Chores', hidden: false },
          ],
        },
      },
    ],
    '@semantic-release/changelog',
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
  ],
};