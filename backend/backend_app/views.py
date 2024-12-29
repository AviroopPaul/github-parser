from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import TestConnection
import requests
import os
from dotenv import load_dotenv
from base64 import b64decode
import groq
import json

# Load environment variables
load_dotenv()
print("Environment variables loaded")

# GitHub OAuth settings
GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET')
GITHUB_REDIRECT_URI = os.environ.get('GITHUB_REDIRECT_URI')
print(f"GitHub OAuth settings loaded - Client ID: {GITHUB_CLIENT_ID}, Redirect URI: {GITHUB_REDIRECT_URI}")

# Add this with your other environment variables
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
groq_client = groq.Groq(api_key=GROQ_API_KEY)

@api_view(['POST'])
def github_login(request):
    """Handle the GitHub OAuth callback"""
    print("GitHub login endpoint called")
    try:
        code = request.data.get('code')
        print(f"Received GitHub code: {code}")
        print(f"GitHub OAuth settings - Client ID: {GITHUB_CLIENT_ID}, Client Secret: {GITHUB_CLIENT_SECRET}, Redirect URI: {GITHUB_REDIRECT_URI}")
        
        # Exchange code for access token
        token_url = 'https://github.com/login/oauth/access_token'
        print(f"Making request to token URL: {token_url}")
        response = requests.post(
            token_url,
            data={
                'client_id': GITHUB_CLIENT_ID,
                'client_secret': GITHUB_CLIENT_SECRET,
                'code': code
            },
            headers={'Accept': 'application/json'}
        )
        
        token_data = response.json()
        print(f"Token response received: {token_data}")
        
        if 'error' in token_data:
            print(f"Error in token response: {token_data}")
            return Response({
                'error': token_data.get('error_description', 'Failed to obtain access token'),
                'details': token_data
            }, status=400)
            
        access_token = token_data['access_token']
        print("Successfully obtained access token")
        
        # Get user data from GitHub
        user_url = 'https://api.github.com/user'
        print(f"Making request to user URL: {user_url}")
        user_response = requests.get(
            user_url,
            headers={
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
        )
        
        user_data = user_response.json()
        print(f"User data received: {user_data}")
        
        return Response({
            'access_token': access_token,
            'user': {
                'id': user_data['id'],
                'login': user_data['login'],
                'name': user_data.get('name'),
                'avatar_url': user_data.get('avatar_url'),
                'email': user_data.get('email')
            }
        })
        
    except Exception as e:
        print(f"Error in github_login: {str(e)}")
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['GET'])
def test_mongodb(request):
    print("MongoDB test endpoint called")
    try:
        # Try to create a test document
        print("Attempting to create test document")
        test_doc = TestConnection(message="MongoDB connection successful!").save()
        
        # Retrieve the document to verify
        print("Attempting to retrieve test document")
        retrieved_doc = TestConnection.objects.first()
        
        print("MongoDB test successful")
        return Response({
            'status': 'success',
            'message': retrieved_doc.message,
            'timestamp': retrieved_doc.timestamp,
            'total_documents': TestConnection.objects.count()
        })
    except Exception as e:
        print(f"Error in test_mongodb: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=500)

@api_view(['GET'])
def github_repos(request):
    """Fetch repositories for the authenticated user"""
    print("GitHub repos endpoint called")
    try:
        # Get access token from request headers
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({
                'error': 'No authorization token provided'
            }, status=401)
        
        access_token = auth_header.split(' ')[1]
        
        # Fetch repositories from GitHub API
        repos_url = 'https://api.github.com/user/repos'
        print(f"Fetching repos from: {repos_url}")
        repos_response = requests.get(
            repos_url,
            headers={
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            },
            params={
                'sort': 'updated',
                'per_page': 100  # Adjust this value based on your needs
            }
        )
        
        if repos_response.status_code != 200:
            print(f"Error fetching repos: {repos_response.json()}")
            return Response({
                'error': 'Failed to fetch repositories'
            }, status=repos_response.status_code)
        
        repos_data = repos_response.json()
        
        # Transform the response to include only necessary data
        simplified_repos = [{
            'id': repo['id'],
            'name': repo['name'],
            'full_name': repo['full_name'],
            'description': repo['description'],
            'html_url': repo['html_url'],
            'language': repo['language'],
            'stargazers_count': repo['stargazers_count'],
            'updated_at': repo['updated_at'],
            'visibility': repo['visibility']
        } for repo in repos_data]
        
        return Response(simplified_repos)
        
    except Exception as e:
        print(f"Error in github_repos: {str(e)}")
        return Response({
            'error': str(e)
        }, status=500)

@api_view(['GET'])
def generate_repo_summary(request, repo_name):
    """Generate a summary for the specified repository"""
    print(f"Generating summary for repo: {repo_name}")
    try:
        # Get access token from request headers
        auth_header = request.headers.get('Authorization')
        print(f"Auth header: {auth_header}")
        if not auth_header or not auth_header.startswith('Bearer '):
            print("No valid authorization token found")
            return Response({
                'error': 'No authorization token provided'
            }, status=401)
        
        access_token = auth_header.split(' ')[1]
        print(f"Access token obtained: {access_token[:10]}...")
        
        # First, get the repository details
        repo_url = f'https://api.github.com/repos/AviroopPaul/{repo_name}'
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        print(f"Fetching repo details from: {repo_url}")
        
        repo_response = requests.get(repo_url, headers=headers)
        print(f"Repo details response status: {repo_response.status_code}")
        if repo_response.status_code != 200:
            print(f"Failed to fetch repo details: {repo_response.json()}")
            return Response({
                'error': 'Failed to fetch repository details'
            }, status=repo_response.status_code)
        
        repo_data = repo_response.json()
        print(f"Successfully fetched repo data for: {repo_data['full_name']}")
        
        # Fetch the README content
        # https://github.com/AviroopPaul/fintrac/blob/main/README.md
        readme_url = f'https://api.github.com/repos/AviroopPaul/{repo_name}/readme'
        print(f"Fetching README from: {readme_url}")
        readme_response = requests.get(readme_url, headers=headers)
        print(f"README response status: {readme_response.status_code}")
        
        readme_content = ""
        if readme_response.status_code == 200:
            readme_data = readme_response.json()
            readme_content = b64decode(readme_data['content']).decode('utf-8')
            print(f"README content length: {len(readme_content)} characters")
        else:
            print("No README found or unable to fetch README")
        
        # Fetch repository languages
        languages_url = repo_data['languages_url']
        print(f"Fetching languages from: {languages_url}")
        languages_response = requests.get(languages_url, headers=headers)
        print(f"Languages response status: {languages_response.status_code}")
        languages = []
        if languages_response.status_code == 200:
            languages = list(languages_response.json().keys())
            print(f"Languages found: {languages}")
        else:
            print("No languages found or unable to fetch languages")
        
        # Prepare context for AI summary
        context = {
            "name": repo_data['name'],
            "description": repo_data['description'] or "",
            "languages": languages,
            "readme_excerpt": readme_content[:4000] if readme_content else "",  # Limit README length
            "stars": repo_data['stargazers_count'],
            "forks": repo_data['forks_count']
        }
        print("Context prepared for AI summary")
        print(f"Stars: {context['stars']}, Forks: {context['forks']}")
        
        # Generate summary using Groq
        prompt = f"""Given the following GitHub repository information, generate a concise, professional summary suitable for a Software Engineer resume. Focus on the key technologies, purpose, and notable features. Follow the STAR format. Put metrics. Format the response in bullet points, which should be descriptive and not just superficial.

Repository Information:
- Name: {context['name']}
- Description: {context['description']}
- Primary Languages: {', '.join(context['languages'])}
- Stars: {context['stars']}
- Forks: {context['forks']}

README Excerpt:
{context['readme_excerpt']}

Generate a summary in 3 points, highlighting the most important aspects of the project."""

        print("Sending request to Groq API")
        completion = groq_client.chat.completions.create(
            model="mixtral-8x7b-32768",  # or another appropriate model
            messages=[
                {"role": "system", "content": "You are a technical writer who creates concise, professional project summaries."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        print("Received response from Groq API")

        summary = completion.choices[0].message.content
        print(f"Generated summary length: {len(summary)} characters")

        return Response({
            'content': summary,
            'repo_name': repo_name,
            'languages': languages
        })

    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        print(f"Error type: {type(e)}")
        print(f"Error traceback: {e.__traceback__}")
        return Response({
            'error': f"Failed to generate summary: {str(e)}"
        }, status=500)
