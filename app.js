var loopback = require('loopback');

function loopbackApp() {

	var app = loopback();

	//datasource configuration
	var dsConfig = {
		dsName : 'db',
		options : {'connector': 'memory'}
	}

	//model configuration
	var modelConfig = {
		modelName : 'Movies',
		options : {
			"name": "Movies",
		    "plural": "Movies",
		    "base": "Model",
		    "strict":"validate",
		    "idInjection": false,
		    "properties": {
		      "name": {
		        "type": "string",
		        "required": true
		      },
		      "genre": {
		        "type": "string",
		        "required": true
		      },
		      "year": {
		        "type": "number",
		        "required": true
		      }
		    },
		    "dataSource": "db",
		    "public": true
		}
	}

	//app configuration
	var config = {
		"restApiRoot" : "/api",
		"port" : 3005
	}

	var myModel;


	//load everything
	loadDataSource(app, dsConfig);
	myModel = loadModel(app, modelConfig);
	loadRemoteMethods(myModel);
	loadSampleData(myModel);
	loadExplorer(app, config);
	loadMiddlewares(app, config);

	//start server
	startServer(app, config);

}

loopbackApp();


function loadDataSource(app, dsConfig) {
	app.dataSource(dsConfig.dsName, dsConfig.options);	
}


function loadModel(app, modelConfig) {
	app.model(modelConfig.modelName, modelConfig.options);
	return app.models[modelConfig.modelName];
}


function loadRemoteMethods(myModel) {
	
	myModel.findByGenre = function(genre, next) {
        var clause = {where: {genre: genre}};
        myModel.find(clause, function(err, data) {
           next(err, data);
        });

        
    };

    myModel.remoteMethod('findByGenre', {
        http : {
            path : '/byGenre',
            verb : 'get'
        },
        accepts : [ {
            arg : 'genre',
            type : 'string',
            description: 'Movie Genre',
            required: true,
            http : {
                source : 'query'
            }
        }],
        returns : {
            arg : 'movies',
            type : 'Movies'
        },
        description: 'Get Movie Details By genre',
        notes: 'Returns movie object for a given movie genre'
    });

}


function loadSampleData(myModel) {
	myModel.create([
      {name: 'Andaz Apna Apna', genre: 'Comedy', year: 1994},
      {name: 'The Grand Budapest Hotel', genre: 'Adventure', year: 2014},
      {name: '12 Angry Men', genre: 'Crime', year: 1957},
      {name: 'Pulp Fiction', genre: 'Crime', year: 1994}
    ], function(err, movies) {
      if (err) throw err;
    });
}


function loadExplorer(app, config) {
	var explorer;
	
	try {
		explorer = require('loopback-explorer');
	} catch(err) {
		console.log(
		  'Run `npm install loopback-explorer` to enable the LoopBack explorer'
		);
		return;
	}

	var restApiRoot = config['restApiRoot'];

	var explorerApp = explorer(app, { basePath: restApiRoot });
	app.use('/explorer', explorerApp);

	app.once('started', function() {
		var explorerPath = explorerApp.mountpath || explorerApp.route;
	});
}


function loadMiddlewares(app, config) {
	app.use(config['restApiRoot'],loopback.rest());
}


function startServer(app, config) {
	app.start = function() {
	  // start the web server
	  return app.listen(function() {
	    app.emit('started');
	    console.log('Web server started');
	  });
	};

	if (require.main === module) {
	  app.start();
	}

	app.listen(config['port']);	
}