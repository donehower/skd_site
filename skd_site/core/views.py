from flask import render_template, Blueprint, jsonify
from skd_site import mongo


core = Blueprint('core', __name__)


@core.route('/', methods=['GET', 'POST'])
def index():

    return render_template('about.html')


@core.route('/about', methods=['GET', 'POST'])
def about():

    return render_template('about.html')


@core.route('/contact', methods=['GET', 'POST'])
def contact_info():

    return render_template('contact_info.html')


@core.route('/projects', methods=['GET', 'POST'])
def projects():

    return render_template('projects.html')


@core.route('/campaign_notebook', methods=['GET', 'POST'])
def campaign_notebook():

    return render_template('campaign_notebook.html')


@core.route('/d3_senate', methods=['GET', 'POST'])
def d3_senate():

    return render_template('d3_senate.html')


@core.route('/get_senate_data', methods=['GET', 'POST'])
def get_senate_data():

    data = mongo.db.senate_data.find()

    return jsonify(data)
