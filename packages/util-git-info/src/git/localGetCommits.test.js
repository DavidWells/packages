const { test } = require('uvu')
const assert = require('uvu/assert')
const { formatJSON, attemptToFix } = require('./localGetCommits')

test('generates a JSON-like commit message', async () => {
  assert.equal(formatJSON, '{ "sha": "%H", "parents": "%p", "author": {"name": "%an", "email": "%ae" }, "committer": {"name": "%cn", "email": "%ce" }, "subject": "%s", "sanitizedSubject": "%f", "body": "%b", "authoredOn": "%aI", "committedOn": "%cI"},')
  const withoutComma = formatJSON.substring(0, formatJSON.length - 1)
  assert.not.throws(() => JSON.parse(withoutComma))
})

const malformedCommits = `  {
    "sha": "5212346705e719bb46db0b0e651e2752de4078ff",
    "parents": "077df0e",
    "author": {
      "name": "Guy Fox",
      "email": "email@email.com"
    },
    "committer": {
      "name": "Guy Fox",
      "email": "email@email.com"
    },
    "subject": "Revert "
    fix(files): show slash - prefixed files and non - slash - prefixed files;don 't force a slash prefix on file upload"", "sanitizedSubject": "Revert-fix-files-show-slash-prefixed-files-and-non-slash-prefixed-files-don-t-force-a-slash-prefix-on-file-upload", "body": "This reverts commit 077df0ebff5396bf6a3491c4342fdc53e6844469.\n", "authoredOn": "2021-10-06T09:52:06+10:00", "committedOn": "2021-10-06T09:52:06+10:00"}, {
      "sha": "077df0ebff5396bf6a3491c4342fdc53e6844469",
      "parents": "08979d4",
      "author": {
        "name": "Guy Fox",
        "email": "email@email.com"
      },
      "committer": {
        "name": "Guy Fox",
        "email": "email@email.com"
      },
      "subject": "fix(files): show slash-prefixed files and non-slash-prefixed files; don't force a slash prefix on file upload",
      "sanitizedSubject": "fix-files-show-slash-prefixed-files-and-non-slash-prefixed-files-don-t-force-a-slash-prefix-on-file-upload",
      "body": "",
      "authoredOn": "2021-10-06T09:50:38+10:00",
      "committedOn": "2021-10-06T09:50:38+10:00"
    }, {
      "sha": "1587784f0abb5dd09268d5ca0ad80dad1c75f268",
      "parents": "08979d4",
      "author": {
        "name": "Bill Steves",
        "email": ""
      },
      "committer": {
        "name": "Bill Steves",
        "email": ""
      },
      "subject": "fix: ensure sentry errors are errors",
      "sanitizedSubject": "fix-ensure-sentry-errors-are-errors",
      "body": "",
      "authoredOn": "2021-10-05T12:25:03-07:00",
      "committedOn": "2021-10-05T12:25:03-07:00"
    },
    {
      "sha": "08979d440ef99c5e7b9be7f0253534d1774f1222",
      "parents": "64f3540 4e67d8f",
      "author": {
        "name": "Bill Steves",
        "email": "email@two.com"
      },
      "committer": {
        "name": "GitHub",
        "email": "noreply@github.com"
      },
      "subject": "Merge pull request #38 from vendia/dw/remove-user-type",
      "sanitizedSubject": "Merge-pull-request-38-from-vendia-dw-remove-user-type",
      "body": "fix: disable "
      Vendia User " until FE supports",
      "authoredOn": "2021-10-01T15:07:15-07:00",
      "committedOn": "2021-10-01T15:07:15-07:00"
    },`

test('Parses commits', async () => {
  const commits = attemptToFix(malformedCommits.substring(0, malformedCommits.length - 1))
  assert.equal(commits, [
    {
      sha: '5212346705e719bb46db0b0e651e2752de4078ff',
      parents: '077df0e',
      author: { name: 'Guy Fox', email: 'email@email.com' },
      committer: { name: 'Guy Fox', email: 'email@email.com' },
      subject: "Revert     fix(files): show slash - prefixed files and non - slash - prefixed files;don 't force a slash prefix on file upload",
      sanitizedSubject: 'Revert-fix-files-show-slash-prefixed-files-and-non-slash-prefixed-files-don-t-force-a-slash-prefix-on-file-upload',
      body: 'This reverts commit 077df0ebff5396bf6a3491c4342fdc53e6844469.',
      authoredOn: '2021-10-06T09:52:06+10:00',
      committedOn: '2021-10-06T09:52:06+10:00'
    },
    {
      sha: '077df0ebff5396bf6a3491c4342fdc53e6844469',
      parents: '08979d4',
      author: { name: 'Guy Fox', email: 'email@email.com' },
      committer: { name: 'Guy Fox', email: 'email@email.com' },
      subject: "fix(files): show slash-prefixed files and non-slash-prefixed files; don't force a slash prefix on file upload",
      sanitizedSubject: 'fix-files-show-slash-prefixed-files-and-non-slash-prefixed-files-don-t-force-a-slash-prefix-on-file-upload',
      body: '',
      authoredOn: '2021-10-06T09:50:38+10:00',
      committedOn: '2021-10-06T09:50:38+10:00'
    },
    {
      sha: '1587784f0abb5dd09268d5ca0ad80dad1c75f268',
      parents: '08979d4',
      author: { name: 'Bill Steves', email: '' },
      committer: { name: 'Bill Steves', email: '' },
      subject: 'fix: ensure sentry errors are errors',
      sanitizedSubject: 'fix-ensure-sentry-errors-are-errors',
      body: '',
      authoredOn: '2021-10-05T12:25:03-07:00',
      committedOn: '2021-10-05T12:25:03-07:00'
    },
    {
      sha: '08979d440ef99c5e7b9be7f0253534d1774f1222',
      parents: '64f3540 4e67d8f',
      author: { name: 'Bill Steves', email: 'email@two.com' },
      committer: { name: 'GitHub', email: 'noreply@github.com' },
      subject: 'Merge pull request #38 from vendia/dw/remove-user-type',
      sanitizedSubject: 'Merge-pull-request-38-from-vendia-dw-remove-user-type',
      body: 'fix: disable       Vendia User  until FE supports',
      authoredOn: '2021-10-01T15:07:15-07:00',
      committedOn: '2021-10-01T15:07:15-07:00'
    }
  ])
})

test.run()
