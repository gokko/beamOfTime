from setuptools import setup

setup(
    name='neopixelEmulator',
    version='0.1',
    description='Neopixel emulator to be used with beam of time LED clock on non raspberry pi',
    author='Gottfried Koschel',
    author_email='beamoftime@koschel.org',
    url='http://www.beamoftime.com',
    py_modules=['board', 'neopixel'],
    data_files=[('', ['blackCircle.gif'])],
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
    ],
)