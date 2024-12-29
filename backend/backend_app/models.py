from mongoengine import Document, StringField, DateTimeField
from datetime import datetime

class TestConnection(Document):
    message = StringField(required=True)
    timestamp = DateTimeField(default=datetime.utcnow)
