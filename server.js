const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');

const app = express();

//criar e conectar o cliente redis à instância local
const client = redis.createClient(7777);

client.on('error', err => {
    console.log("Error ", err);
});

app.get('/photos', (req, res) => {
    // chave para armazenar resultados no Redis
    const photosRedisKey = 'user:photos'

    /// Tente buscar o resultado do Redis primeiro, caso o tenhamos armazenado em cache
    return client.get(photosRedisKey, (err, photos)=>{

        if(photos) {
            return res.json({source: 'cache', data:JSON.parse(photos)})
        } else {// A chave não existe no Redis
            fetch('https://jsonplaceholder.typicode.com/photos')
                .then(responde => responde.json())
                .then(photos => {
                    // Salve a resposta da API no armazenamento Redis, os dados expiram em 3600 segundos, isso significa uma hora
                    client.setex(photosRedisKey, 3600, JSON.stringify(photos))

                    // Envia resposta JSON ao cliente
                    return res.json({source:'api', data:photos})
                })
                .catch(error => {
                    console.log(error)
                    return res.json(error.toString())
                })
        }
    });
});

// start express server at 3000 port
app.listen(3000, () => {
    console.log('Server listening on port: ', 3000)
});