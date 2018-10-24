from flask import render_template, Blueprint


core = Blueprint('core', __name__)


@core.route('/about', methods=['GET', 'POST'])
def about():

    return render_template('about.html')


@core.route('/contact', methods=['GET', 'POST'])
def contact_info():

    return render_template('contact_info.html')
