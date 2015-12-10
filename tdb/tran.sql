CREATE TABLE "tran" ("tran_id" VARCHAR(16) PRIMARY KEY  NOT NULL , "data_cnt" INTEGER NOT NULL , "recorded" INTEGER NOT NULL  DEFAULT 0);
CREATE TABLE "tran_ch" ("id" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "tran_id" VARCHAR(16) NOT NULL , "ch_id" VARCHAR(10) NOT NULL );
CREATE TABLE "tran_data" ("data_id" VARCHAR(16) PRIMARY KEY  NOT NULL , "tran_id" VARCHAR(16) NOT NULL );