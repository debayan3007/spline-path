const fs = require('fs')
const spline = require('../spline')

let html = `<svg height="800" width="900">
<path id="lineAB" d="${spline([
    {x:100, y:20},
    {x:200,y:300},
    {x:300,y:100},
    {x:400,y:500},
    {x:500, y: 200},
    {x: 600, y: 400}
])}" stroke="red" stroke-width="3" fill="none" />
</svg>`

fs.writeFileSync('./example/index.html', html, 'utf8')