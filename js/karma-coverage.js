const percentage = {
    lines: 97,
    statements: 97,
    functions: 100,
    branches: 86
}
var summary = require('./karma/coverage/coverage-summary.json');

for (let res in summary.total) {
    if (summary.total[res].pct < percentage[res]) {
        throw new Error(
            `Coverage too low on ${res},
            expected: ${percentage[res]},
            got: ${summary.total[res].pct}`
        );
    }
}