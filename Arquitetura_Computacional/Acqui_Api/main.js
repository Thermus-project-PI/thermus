// importa os bibliotecas necessários
const serialport = require('serialport');
const express = require('express');
const mysql = require('mysql2');

const SERVIDOR_PORTA = 3300;
const SERIAL_BAUD_RATE = 9600; // velocidade de comunicação entre o arduino e o computador


const HABILITAR_OPERACAO_INSERIR = true;


const serial = async (
    valoresSensorTemperatura,
    valoresSensorUmidade,
) => {


    let poolBancoDados = mysql.createPool(
        {
            host: 'localhost',
            user: 'THERMUS-LUBUNTU',
            password: 'Sptech#2024',
            database: 'thermus',
            port: 3307 
        }
    ).promise();

  // lista todas as portas seriais do computador 
    const portas = await serialport.SerialPort.list();
 // procura porta serial do arduino na lista geral
    const portaArduino = portas.find((porta) => porta.vendorId == 2341 && porta.productId == 43);
    if (!portaArduino) {
        throw new Error('O arduino não foi encontrado em nenhuma porta serial');
    }

    const arduino = new serialport.SerialPort( // inicia a comunicação serial com o arduino, 
    // na porta encontrada com a velocidade definida (9600)
        {
            path: portaArduino.path, 
            baudRate: SERIAL_BAUD_RATE 
        }
    );


    arduino.on('open', () => { 
        console.log(`A leitura do arduino foi iniciada na porta ${portaArduino.path} utilizando Baud Rate de ${SERIAL_BAUD_RATE}`);
    });

    // mais importante
    arduino.pipe(new serialport.ReadlineParser({ delimiter: '\r\n' })).on('data', async (data) => {
        console.log(data);
        // separa os valores recebidos do arduino pelo ; e transforma isso em um vetor
        const valores = data.split(';'); 
        const sensorUmidade = parseInt(valores[0]);
        const sensorTemperatura = parseFloat(valores[1]);
        // calcula o ponto de orvalho de acordo com os dados recebidos
        let pontoOrvalho = sensorTemperatura-((100-sensorUmidade)/5);
        let agora = new Date()

        // insere no vetor para que possam ser exibidos no grafico teste
        valoresSensorTemperatura.push(sensorTemperatura);
        valoresSensorUmidade.push(sensorUmidade); 

        //
        if (HABILITAR_OPERACAO_INSERIR) {

            //insere no banco
            await poolBancoDados.execute(
                'INSERT INTO leitura (fk_sensor1, temperatura, umidade, pontoOrvalho, dataHora) value (1, ?, ?, ?, ?)',
                [sensorTemperatura, sensorUmidade, pontoOrvalho, agora]
            );
            console.log("valores inseridos no banco: ", sensorTemperatura + ", " + sensorUmidade);

        }

    });

    //
    arduino.on('error', (mensagem) => {
        console.error(`Erro no arduino (Mensagem: ${mensagem}`)
    });
}

// 
const servidor = (
    valoresSensorTemperatura,
    valoresSensorUmidade
) => {
    const app = express();

    // o app.use configura os headers
    app.use((request, response, next) => {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept');
        next();
    });

    // iniciar o servidor na porta especificada (começa ouvir requisiçoes)
    app.listen(SERVIDOR_PORTA, () => {
        console.log(`API executada com sucesso na porta ${SERVIDOR_PORTA}`);
    });

    // configurar os endpoints 
    // retorna o json dos valores de temperatura
    app.get('/sensores/Temperatura', (_, response) => {
        return response.json(valoresSensorTemperatura);
    });
    // retorna o json dos valores de umidade
    app.get('/sensores/Umidade', (_, response) => {
        return response.json(valoresSensorUmidade);
    });
}

// 
(async () => {
    // 
    const valoresSensorTemperatura = [];
    const valoresSensorUmidade = [];

    // espera iniciar uma comunicaçao na porta serial
    await serial(
        valoresSensorTemperatura,
        valoresSensorUmidade
    );

    // se nao for inciado nenhuma comunicaçao gera um erro e nem inicia o servidor
    servidor(
        valoresSensorTemperatura,
        valoresSensorUmidade
    );
})();