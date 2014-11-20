
module.exports = function Ticker_ExtJs_4(api, cfg){
var name = '/Ticker_ExtJs_4/'
   ,n = '/css' + name + 'css'

    api.app.use(name, api.connect['static'](__dirname))
    api.app.use(n, api.connect.sendFile(
        __dirname + '/ticker.css', true/* full path*/
    ))
    return { css:[n], js:[ name + 'demo/demo'], cfg: cfg}
}
