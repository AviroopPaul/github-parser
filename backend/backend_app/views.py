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
from packaging import version
import re
from datetime import datetime
import base64

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
        
        # First get the user data to get the username
        user_response = requests.get(
            'https://api.github.com/user',
            headers={
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
        )
        
        if user_response.status_code != 200:
            return Response({
                'error': 'Failed to fetch user data'
            }, status=user_response.status_code)
            
        username = user_response.json()['login']
        
        # Use the fetched username instead of hardcoded value
        repo_url = f'https://api.github.com/repos/{username}/{repo_name}'
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
        readme_url = f'https://api.github.com/repos/{username}/{repo_name}/readme'
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

@api_view(['GET'])
def check_dependencies(request, repo_name):
    """Check dependencies versions for a repository by recursively searching for dependency files"""
    print(f"Checking dependencies for repo: {repo_name}")
    try:
        # Get access token from request headers
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({
                'error': 'No authorization token provided'
            }, status=401)
        
        access_token = auth_header.split(' ')[1]
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/vnd.github.v3+json'
        }

        dependencies = {
            'npm': {},
            'pip': {}
        }

        # Get the user data to get the username
        user_response = requests.get(
            'https://api.github.com/user',
            headers={
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
        )
        
        if user_response.status_code != 200:
            return Response({
                'error': 'Failed to fetch user data'
            }, status=user_response.status_code)
            
        username = user_response.json()['login']
        
        # Update tree URL to use dynamic username
        tree_url = f'https://api.github.com/repos/{username}/{repo_name}/git/trees/main?recursive=1'
        tree_response = requests.get(tree_url, headers=headers)
        
        if tree_response.status_code != 200:
            # Try 'master' branch if 'main' doesn't exist
            tree_url = f'https://api.github.com/repos/{username}/{repo_name}/git/trees/master?recursive=1'
            tree_response = requests.get(tree_url, headers=headers)
            
            if tree_response.status_code != 200:
                return Response({
                    'error': 'Could not access repository tree'
                }, status=tree_response.status_code)

        tree_data = tree_response.json()
        
        # Find all package.json and requirements.txt files
        package_files = [item['path'] for item in tree_data['tree'] 
                        if item['path'].endswith('package.json')]
        requirements_files = [item['path'] for item in tree_data['tree'] 
                            if item['path'].endswith('requirements.txt')]

        # Check NPM dependencies for each package.json
        for package_path in package_files:
            try:
                file_url = f'https://api.github.com/repos/{username}/{repo_name}/contents/{package_path}'
                package_response = requests.get(file_url, headers=headers)
                
                if package_response.status_code == 200:
                    content = b64decode(package_response.json()['content']).decode('utf-8')
                    package_data = json.loads(content)
                    
                    # Combine all dependencies
                    all_deps = {}
                    if 'dependencies' in package_data:
                        all_deps.update(package_data['dependencies'])
                    if 'devDependencies' in package_data:
                        all_deps.update(package_data['devDependencies'])

                    # Check each dependency
                    for pkg, current_version in all_deps.items():
                        # Remove version prefix characters (^, ~, etc.)
                        current_version = re.sub(r'^[^0-9]*', '', current_version)
                        
                        # Get latest version from npm registry
                        npm_response = requests.get(f'https://registry.npmjs.org/{pkg}/latest')
                        if npm_response.status_code == 200:
                            latest_version = npm_response.json()['version']
                            dependencies['npm'][pkg] = {
                                'current': current_version,
                                'latest': latest_version,
                                'file_path': package_path
                            }
            except Exception as e:
                print(f"Error checking NPM dependencies in {package_path}: {str(e)}")

        # Check Python dependencies for each requirements.txt
        for req_path in requirements_files:
            try:
                file_url = f'https://api.github.com/repos/{username}/{repo_name}/contents/{req_path}'
                requirements_response = requests.get(file_url, headers=headers)
                
                if requirements_response.status_code == 200:
                    content = b64decode(requirements_response.json()['content']).decode('utf-8')
                    
                    # Parse requirements.txt
                    for line in content.split('\n'):
                        if line and not line.startswith('#'):
                            # Parse package name and version
                            match = re.match(r'^([a-zA-Z0-9\-_]+)(?:[=!<>]+([0-9\.]+))?', line.strip())
                            if match:
                                pkg_name = match.group(1)
                                current_version = match.group(2) or "0.0.0"
                                
                                # Get latest version from PyPI
                                pypi_response = requests.get(f'https://pypi.org/pypi/{pkg_name}/json')
                                if pypi_response.status_code == 200:
                                    latest_version = pypi_response.json()['info']['version']
                                    dependencies['pip'][pkg_name] = {
                                        'current': current_version,
                                        'latest': latest_version,
                                        'file_path': req_path
                                    }
            except Exception as e:
                print(f"Error checking Python dependencies in {req_path}: {str(e)}")

        if not dependencies['npm'] and not dependencies['pip']:
            return Response({
                'message': 'No dependency files found in the repository'
            })

        return Response(dependencies)

    except Exception as e:
        print(f"Error in check_dependencies: {str(e)}")
        return Response({
            'error': f"Failed to check dependencies: {str(e)}"
        }, status=500)

@api_view(['POST'])
def update_dependencies(request, repo_name):
    """Create a PR with updated dependencies"""
    print(f"Updating dependencies for repo: {repo_name}")
    try:
        # Get access token from request headers
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({
                'error': 'No authorization token provided'
            }, status=401)
        
        access_token = auth_header.split(' ')[1]
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/vnd.github.v3+json'
        }

        # Get the file content and updates from request
        file_path = request.data.get('file_path')
        updates = request.data.get('updates')
        file_type = 'package.json' if file_path.endswith('package.json') else 'requirements.txt'

        # Get the user data to get the username
        user_response = requests.get(
            'https://api.github.com/user',
            headers=headers
        )
        
        if user_response.status_code != 200:
            return Response({
                'error': 'Failed to fetch user data'
            }, status=user_response.status_code)
            
        username = user_response.json()['login']
        
        # Update all URLs to use dynamic username
        repo_url = f'https://api.github.com/repos/{username}/{repo_name}'
        
        # Get repository info to determine default branch
        repo_response = requests.get(repo_url, headers=headers)
        if repo_response.status_code != 200:
            return Response({'error': 'Could not fetch repository information'}, status=500)
        
        default_branch = repo_response.json()['default_branch']
        
        # Get the current file content
        file_url = f'https://api.github.com/repos/{username}/{repo_name}/contents/{file_path}'
        file_response = requests.get(file_url, headers=headers)
        if file_response.status_code != 200:
            return Response({'error': 'Could not fetch file content'}, status=404)

        file_data = file_response.json()
        current_content = b64decode(file_data['content']).decode('utf-8')
        current_sha = file_data['sha']

        # Create new branch
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        new_branch = f'dependency-updates-{timestamp}'

        # Get the SHA of the default branch
        ref_response = requests.get(
            f'https://api.github.com/repos/{username}/{repo_name}/git/refs/heads/{default_branch}',
            headers=headers
        )
        if ref_response.status_code != 200:
            return Response({'error': 'Could not get default branch reference'}, status=500)

        sha = ref_response.json()['object']['sha']

        # Create new branch
        create_branch_response = requests.post(
            f'https://api.github.com/repos/{username}/{repo_name}/git/refs',
            headers=headers,
            json={
                'ref': f'refs/heads/{new_branch}',
                'sha': sha
            }
        )
        if create_branch_response.status_code != 201:
            return Response({'error': 'Could not create new branch'}, status=500)

        # Update file content
        new_content = current_content
        if file_type == 'package.json':
            package_data = json.loads(current_content)
            for pkg, versions in updates.items():
                if 'dependencies' in package_data and pkg in package_data['dependencies']:
                    package_data['dependencies'][pkg] = f"^{versions['latest']}"
                if 'devDependencies' in package_data and pkg in package_data['devDependencies']:
                    package_data['devDependencies'][pkg] = f"^{versions['latest']}"
            new_content = json.dumps(package_data, indent=2)
        else:  # requirements.txt
            lines = current_content.split('\n')
            new_lines = []
            for line in lines:
                if line.strip() and not line.startswith('#'):
                    pkg_name = re.match(r'^([a-zA-Z0-9\-_]+)', line.strip())
                    if pkg_name and pkg_name.group(1) in updates:
                        new_lines.append(f"{pkg_name.group(1)}=={updates[pkg_name.group(1)]['latest']}")
                    else:
                        new_lines.append(line)
                else:
                    new_lines.append(line)
            new_content = '\n'.join(new_lines)

        # Commit updated file
        update_file_response = requests.put(
            file_url,
            headers=headers,
            json={
                'message': 'Update dependencies to latest versions',
                'content': base64.b64encode(new_content.encode()).decode(),
                'sha': current_sha,
                'branch': new_branch
            }
        )
        if update_file_response.status_code != 200:
            return Response({'error': 'Could not update file'}, status=500)

        # Create Pull Request
        pr_response = requests.post(
            f'https://api.github.com/repos/{username}/{repo_name}/pulls',
            headers=headers,
            json={
                'title': 'Update Dependencies to Latest Versions',
                'body': 'This PR updates the following dependencies to their latest versions:\n\n' +
                       '\n'.join([f"- `{pkg}`: `{ver['current']}` → `{ver['latest']}`" for pkg, ver in updates.items()]),
                'head': new_branch,
                'base': default_branch
            }
        )
        if pr_response.status_code != 201:
            return Response({'error': 'Could not create pull request'}, status=500)

        pr_data = pr_response.json()
        return Response({
            'message': 'Successfully created pull request',
            'pr_url': pr_data['html_url'],
            'pr_number': pr_data['number']
        })

    except Exception as e:
        print(f"Error in update_dependencies: {str(e)}")
        return Response({
            'error': f"Failed to update dependencies: {str(e)}"
        }, status=500)
