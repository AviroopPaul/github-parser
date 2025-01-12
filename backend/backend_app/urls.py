from django.urls import path
from . import views

print("Loading backend_app URLs")

urlpatterns = [
    path('test-mongodb/', views.test_mongodb, name='test_mongodb'),
    path('github/login/', views.github_login, name='github_login'),
    path('github/repos/', views.github_repos, name='github_repos'),
    path('github/repos/<str:repo_name>/summary', views.generate_repo_summary, name='generate_repo_summary'),
    path('github/repos/<str:repo_name>/dependencies', views.check_dependencies, name='check_dependencies'),
    path('github/repos/<str:repo_name>/update-dependencies', views.update_dependencies, name='update_dependencies'),
]
