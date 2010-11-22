from setuptools import setup, find_packages
import sys, os

version = '1.0'
shortdesc = 'Autocomplete Widget for YAFOWIL - Yet Another Form Widget Library (Python, Web)'
longdesc = open(os.path.join(os.path.dirname(__file__), 'README.rst')).read()

setup(name='yafowil.widget.autocomplete',
      version=version,
      description=shortdesc,
      long_description=longdesc,
      classifiers=[
            'Development Status :: 3 - Alpha',
            'Environment :: Web Environment',
            'Operating System :: OS Independent',
            'Programming Language :: Python', 
            'Topic :: Internet :: WWW/HTTP :: Dynamic Content',        
      ],
      keywords='',
      author='BlueDynamics Alliance',
      author_email='dev@bluedynamics.com',
      url=u'http://github.com/bluedynamics/yafowil.widget.autocomplete',
      license='GNU General Public Licence',
      packages=find_packages('src'),
      package_dir = {'': 'src'},
      namespace_packages=['yafowil', 'yafowil.widget'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
          'yafowil',
      ],
      extras_require = dict(),
      tests_require=[
          'interlude',
      ],
      test_suite="yafowil.widget.dict.tests.test_suite",
      entry_points = """\
      """        
      )
