#!/usr/bin/env python3
"""
Test AI Rego Scan functionality with a sample image
"""

import requests
import json
import base64
from PIL import Image, ImageDraw, ImageFont
import io

# Backend URL
BASE_URL = "https://mymv-auto-1.preview.emergentagent.com/api"

def create_sample_rego_image():
    """Create a sample registration document image"""
    # Create a simple image that looks like a registration document
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font, fallback to basic if not available
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
        font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
    
    # Draw registration document content
    draw.text((50, 50), "VEHICLE REGISTRATION", fill='black', font=font_large)
    draw.text((50, 100), "Registration Number: ABC123", fill='black', font=font_medium)
    draw.text((50, 130), "VIN: 1HGBH41JXMN109186", fill='black', font=font_medium)
    draw.text((50, 160), "Make: Toyota", fill='black', font=font_medium)
    draw.text((50, 190), "Model: Camry", fill='black', font=font_medium)
    draw.text((50, 220), "Year: 2022", fill='black', font=font_medium)
    draw.text((50, 250), "Body Type: Sedan", fill='black', font=font_medium)
    draw.text((50, 280), "Expiry Date: 2025-03-15", fill='black', font=font_medium)
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return img_str

def test_ai_rego_scan():
    """Test the AI Rego Scan endpoint"""
    print("🔍 Testing AI Rego Scan Endpoint")
    print("=" * 50)
    
    # First, we need to authenticate
    auth_data = {
        "email": "sarah.johnson@example.com",
        "password": "SecurePass123!"
    }
    
    try:
        # Login
        response = requests.post(f"{BASE_URL}/auth/login", json=auth_data, timeout=30)
        if response.status_code != 200:
            print(f"❌ Login failed: {response.text}")
            return False
        
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create sample image
        print("📸 Creating sample registration document image...")
        image_base64 = create_sample_rego_image()
        
        # Test AI Rego Scan
        scan_data = {
            "image_base64": image_base64
        }
        
        print("🤖 Sending image to AI Rego Scan endpoint...")
        response = requests.post(
            f"{BASE_URL}/vehicles/extract-rego-data", 
            json=scan_data, 
            headers=headers, 
            timeout=60  # Longer timeout for AI processing
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ AI Rego Scan successful!")
            print("📋 Extracted data:")
            for key, value in data.items():
                print(f"   {key}: {value}")
            return True
        else:
            print(f"❌ AI Rego Scan failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during AI Rego Scan test: {str(e)}")
        return False

if __name__ == "__main__":
    test_ai_rego_scan()