function sleep(milliseconds) {
 return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Sleep Example</h1>
</body>
</html>`;

sleep(10000).then(() => console.log(template));