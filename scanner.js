const request = require('cloudscraper')
var fs = require('fs');

function capturaversao(url) {
    
    return new Promise(function(resolve, reject){
            const timeOut = setTimeout(function(){
                resolve({retorno: JSON.parse(false),versao: 0})
                return;
            },10000);
            request.get(url+'/administrator/manifests/files/joomla.xml',async function (error, response, body) {
                
                if (error) {
                    //console.log(error)
                    clearTimeout(timeOut)
                    resolve({retorno: JSON.parse(false),versao: JSON.parse(0)});
                }
                try {
                    if (body.indexOf('version') > -1) {
                        
                        body = body.substring(body.indexOf('<version>'),body.indexOf('</version>'))
                        body = body.replace('<version>','').replace(/["|']/g,'')
                        clearTimeout(timeOut)
                        resolve({retorno: JSON.parse(true),versao: body})
                    } else {
                        clearTimeout(timeOut)
                        resolve({retorno: JSON.parse(false),versao: JSON.parse(0)});
                    }
                } catch(e) {
                    clearTimeout(timeOut)
                    resolve({retorno: JSON.parse(false),versao: JSON.parse(0)});
                }
            });
        });
    
}

function Captura_Componentes(url) {
    var componentes = []
    return new Promise(async function(resolve, reject){
        var array = fs.readFileSync('componentes.txt').toString().split("\n");
        for(i in array) {
            var temp_componente = array[i].split('|')
            await Captura_Componentes_Check(url,temp_componente[0]).then(function(retorno) {
                console.log('Componte_check:',retorno.versao,retorno.retorno)
                if (retorno.retorno == true) {
                    var linksploit = temp_componente[2]
                    try {
                        if (linksploit.indexOf('/') > -1) {
                            var linksploit2 = linksploit.split('/')
                            linksploit = ""
                            for(i in linksploit2) {
                                linksploit = linksploit + 'https://packetstormsecurity.com/files/'+ linksploit2[i] +  ' -- '
                            }
                        } else {
                            linksploit = 'https://packetstormsecurity.com/files/'+ temp_componente[2]
                        }
                    } catch (error) {
                        linksploit = 'https://packetstormsecurity.com/files/'+ temp_componente[2]
                    }
                    
                    componentes.push({retorno: retorno.versao, afetada: temp_componente[1], exploit: linksploit})
                }
            })
        }      
        resolve(componentes)

    });
}
function Captura_Componentes_Check(url,componente) {
    return new Promise(function(resolve, reject){
        const timeOut = setTimeout(function(){
            resolve({retorno: JSON.parse(false),versao: componente})
                return;
        },10000);
        request.get(url+'/components/'+componente,async function (error, response, body) {
            clearTimeout(timeOut)
            if (error) {
                 resolve({retorno: JSON.parse(false),versao: componente});
            }
            if (response.statusCode == 404) {
                return resolve({retorno: JSON.parse(false),versao: componente});
            }
            try {
                if (body.toLowerCase().indexOf('<title></title>') > -1 || body.indexOf('<body bgcolor="#FFFFFF">') > -1) {
                    Captura_Componentes_Versao(url,componente).then(function(retornoversao) {
                        if (retornoversao.retorno == true) {
                           
                            resolve({retorno: JSON.parse(true),versao: componente+"|"+retornoversao.versao});
                        } else {
                            resolve({retorno: JSON.parse(true),versao: componente});
                        }
                    
                    })
                } else {
                    //console.log(body)
                    resolve({retorno: JSON.parse(false),versao: componente});
                }
            } catch(e) {
                console.log(e)
                resolve({retorno: JSON.parse(false),versao: componente});
            }
        });
    });
}
async function Captura_Componentes_Versao(url,componente) {
    return new Promise(async function(resolve, reject){
            request.get(url+'/administrator/components/'+componente+"/"+componente.replace("com_","")+".xml",async function (error, response, body) {
                
                if (error) return  resolve({retorno: JSON.parse(false)});
                try {
                    if (body.toLowerCase().indexOf('version') > -1) {
                        
                        body = body.substring(body.indexOf('<version'),body.indexOf('</version>'))
                        body = body.replace('<version>','').replace(/["|']/g,'')
                        resolve({retorno: JSON.parse(true),versao: body})
                    } else {
                        resolve({retorno: JSON.parse(false)});
                    }
                } catch(e) {
                    //console.log(e)
                    resolve({retorno: JSON.parse(false)});
                }
            });
        });
    
}

function salvaretorno(url,nome) {
    
    try {
       
        var logger = fs.createWriteStream('retorno_'+nome+'.txt', {
            flags: 'a' // 'a' means appending (old data will be preserved)
        });
 
        logger.write(url+ '\r\n')
        logger.end()
    } catch (err)  {
        console.log(err);
    }
}


class scanner {
    async verfica(url) {
        var versao;
        console.log('URL',url)
        return new Promise(async function(resolve, reject){
            var texto;
            await capturaversao(url).then(async function(retorno) {
                console.log(retorno)
                if (retorno.retorno == true && retorno.versao != '') {
                    versao = retorno.versao;
                    texto = "URL: " + url + '\r\n'
                    texto = texto + "=======================================" + '\r\n'
                    texto = texto + "Version: " + versao + '\r\n'
                    texto = texto + "__________________________________________" + '\r\n'
                    
                    console.log("Version:",versao)
                    await Captura_Componentes(url).then(async function(retornocomponentes) {
                        if (retornocomponentes.length > 0) {

                            for (let i = 0; i < retornocomponentes.length; i++) {
                                texto = texto + "Componente:" +  retornocomponentes[i].retorno + '\r\n'
                                texto = texto + "Versao Afetada:" +  retornocomponentes[i].afetada + '\r\n'
                                texto = texto + "Exploit:" +  retornocomponentes[i].exploit + '\r\n'
                                texto = texto + "__________________________________________" + '\r\n'
                                
                              }
                        }
                        salvaretorno(texto,versao)
                        resolve(true);
                        return;
                    })
                } else {
                    resolve(false);
                    return;
                }
            })
        })
    }
}
module.exports = new scanner();