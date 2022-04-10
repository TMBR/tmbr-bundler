const fs = require('fs');
const encode = require('html-entities').encode;

module.exports = error => {

    const { file, line, column } = error.location;

    const lines = fs.readFileSync(file, 'UTF-8').split(/\r?\n/);
    const index = line - 1;
    const inset = String((lines[index + 2] && line + 2) || (lines[index + 1] && line + 1) || line).split('').length;

    const print = offset => (
        `<span class="c-gray">${String(line + offset).padStart(2 + inset, ' ')} | </span>` + encode(lines[index + offset])
    );

    const space = length => {
        return ' '.repeat(length);
    };

    const output = [
        (index - 2) >= 0 && print(-2),
        (index - 1) >= 0 && print(-1),
        `<span class="c-red fw-700">&gt;</span><span class="c-gray"> ${line} | </span>${encode(lines[index])}`,
        ` <span class="c-gray">${space(2 + inset)}| </span>${space(column ? column - 1 : 0)}<span class="c-red fw-700">^</span>`,
        (index + 1) <= lines.length - 1 && print(1),
        (index + 2) <= lines.length - 1 && print(2),
    ].filter(Boolean).join('\n');

    return /* html */`
<!DOCTYPE html>
<html>
<head>

    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">

    <title>Build Error: ${file}</title>

    <style>

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .c-red    { color: #ff5555; }
    .c-cyan   { color: #88ddff; }
    .c-gray   { color: #666666; }
    .fw-700   { font-weight: 700; }

    ::selection {
        background-color: rgba(95, 126, 151, 0.48);
    }

    html {
        font: 1rem / 1.5 sans-serif;
        color: #FFF;
        background-color: #151515;
    }
    main {
        max-width: 1280px;
        margin: 3em auto;
        padding: 1rem;
    }
    h1 {
        font-size: 1.5rem;
        line-height: 1.5;
        margin-bottom: 0.25em;
    }

    .terminal {
        color: #CCC;
        border-radius: 0.25rem;
    }
    .terminal pre {
        font-family: Menlo, Monaco, monospace;
        overflow: scroll;
    }
    .terminal > * {
        padding: 1rem 0;
    }

    </style>

</head>
<body>

<main>

    <h1>Build Error</h1>

    <div class="terminal">

<pre>
<span class="c-cyan">${file}</span><span class="c-gray">:</span>${line}<span class="c-gray">:</span>${column}
<span class="c-red fw-700">${error.text}</span>

${output}
</pre>

    </div>

</main>

</body>
</html>`};
