from setuptools import setup

setup(
    name='video_analysis_pipeline',
    version='0.1',
    install_requires=[
        'apache-beam[gcp]',
        'google-cloud-videointelligence',
        'google-cloud-aiplatform',
    ],
)
