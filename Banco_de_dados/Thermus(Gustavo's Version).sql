create database thermus;
use thermus;

create table usuario(
	id				int not null auto_increment,
    museusNome		varchar(255),
    email			varchar(255),
    senha			varchar(255),
    cnpj			char(14),
    criadoEm		datetime default current_timestamp,		-- Quando o museu foi criado
	ativo			boolean,								-- Identifica se o museu está ativo ou não
    
    primary key(id)
);

create table sensor(
	id				int not null auto_increment,
    quadroNome		varchar(255),							-- Nome do quadro que o sensor monitora
    localizacao 	varchar(255),							-- localizacao do sensor dentro do museu "Ala B"
    usuarioId		int,									-- Chave estrangeira que referencia o Id do usuario dono do sensor
    status		enum("Ativo", "Inativo", "Manutenção"),		-- Registra se o sensor está ativo, inativo ou em manutenção
    
    primary key(id),
    constraint sensor_usuario foreign key (usuarioId) references usuario(id)
);

create table leitura(
	id	 			int not null auto_increment,
    sensorId		int,
	temperatura		decimal(5, 2),
    umidade			decimal(5, 2),
    pontoOrvalho	decimal(5, 2),
    dataHora		datetime default current_timestamp,
    
    primary key(id),
    constraint leitura_sensor	 foreign key 	(sensorId) references sensor(id),
    constraint chk_temperatura	 check 		 	(temperatura >= -20 and temperatura <= 100),
    constraint chk_umidade		 check 		 	(umidade >= 0 and umidade <= 100),
    constraint chk_pontoOrvalho	 check 		 	(pontoOrvalho >= -20 and pontoOrvalho <= 100)
);

create table alerta(
	id				int not null auto_increment,
    sensorId		int,									-- Chave estrangeira que referencia qual sensor emitiu o alerta
    descricao		varchar(255),							-- Desrcrição breve explicando o motivo do alerta "Estado Crítico de Orvalho"
    resolvido		boolean,								-- Guarda se o problema já foi resolvido
    criadoEm 		datetime default current_timestamp,		-- Armazena o momento em que o alerta foi disparado
    
    primary key(id),
    constraint alerta_usuario foreign key (sensorId) references sensor(id)
);