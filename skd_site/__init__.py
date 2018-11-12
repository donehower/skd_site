from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_pymongo import PyMongo

app = Flask(__name__, instance_relative_config=True)
app.config.from_pyfile('config.py')

# --------------------------------- #
#         Database Set-up           #
# --------------------------------- #
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
Migrate(app, db)
mongo = PyMongo(app)

# --------------------------------- #
#             Blue Prints           #
# --------------------------------- #
from skd_site.core.views import core
# from skd_site.weather.views import skd

app.register_blueprint(core)
# app.register_blueprint(skd)
