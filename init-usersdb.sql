CREATE USER IF NOT EXISTS 'pisbp'@'%' IDENTIFIED BY 'pisbp';
GRANT ALL PRIVILEGES ON users.* TO 'pisbp'@'%';
FLUSH PRIVILEGES;

create database if not exists users;
use users;


create table if not exists users(
	userId int auto_increment,
    firstname varchar(100) not null,
    lastname varchar(100) not null,
    username varchar(100) not null,
    password varchar(256) not null,
    email varchar(100),
    primary key(userId)
);



