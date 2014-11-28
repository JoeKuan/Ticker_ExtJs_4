
module.exports = function Ticker_ExtJs_4(api, cfg){
var name = '/Ticker_ExtJs_4/'
   ,n = '/css' + name + 'css'
   ,http = require('http')

    cfg = { rbac: { can: null, roles: null } }// placeholders

    cfg.rbac.can = {// add authorization tokens -- `can`s
        'Module.Ticker_ExtJs_4.Ticker': true,// permission for 'Ext.ux.Ticker'
        '/demo/stock.php': true// permission for API call to prevent any unauthorized access
    }
    cfg.rbac.roles = {
        'developer.local':[// add permission to existing role
            '/demo/stock.php',// allow api, but this role has special all '/*/lib' access
            'Module.Ticker_ExtJs_4.Ticker'// prefix 'Module' is arbitrary actually
            //      ^^^^^^^^^^^^^^^^^^^^^ this part corresponds to URL/path of component file
        ]
    }

    api.app.use(api.connect.urlencoded({ raw: true }))
    api.app.use('/demo/stock.php', mwStock)
    api.app.use(name, api.connect['static'](__dirname))
    api.app.use(n, api.connect.sendFile(
        __dirname + '/ticker.css', true/* full path*/
    ))
    return { css:[n], js:[ name + 'demo/demo'], cfg: cfg}

    function mwStock(req, res, next){
    var csv = ''
        return http.get(// requesting info from remote api
            'http://download.finance.yahoo.com/d/quotes.csv?' + req.urlencoded,
            get_csv
        ).on('error', ret_data)

        function get_csv(apires){
            apires.on('data', get_chunk)// collecting data chunks
            apires.on('end', ret_data)// end of processing
        }
        function get_chunk(chunk){
            csv += chunk
        }
        function ret_data(e){
        var i, p, rows = csv.split('\r\n')

            if(!e && (!rows[0] || !rows[1])){// check if api response has no error
                e = !rows[0] ? 'API error' : rows[0]// Missing Symbols List.
            } else for(i = 0; i < rows.length - 1; ++i){
                p = rows[i].split(',')
                if(p.length >= 5) rows[i] = {
                    symbol:  p[0].slice(1, 5),// remove double quotes by this
                    price:  +p[1],// implicitly convert to a number
                    change: +p[2],// -"-
                    percent: p[3].slice(1, 7),
                    exchange:p[4].slice(1, p[4].length - 1)
                }
            }
            return res.json({ success: !e, rows: rows, err: e })
        }
    }
}
