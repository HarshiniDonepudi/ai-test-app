#!/usr/bin/env python3
"""
Wound Image Scraper
Scrapes medical wound images from various sources for different etiology types.
"""

import os
import requests
import time
from pathlib import Path
from urllib.parse import quote
import json

# List of wound etiologies
WOUND_ETIOLOGIES = [
    "INSECT BITE",
    "DOG BITE",
    "CAT BITE",
    "HUMAN BITE",
    "BITE (OTHER)",
    "SURGICAL",
    "AUTOIMMUNE",
    "TRAUMA",
    "INFECTIOUS ABCESS",
    "CYST LESION",
    "VASCULITUS",
    "MALIGNANT",
    "MASD",
    "CHRONIC SKIN ULCER",
    "PRESSURE / DEVICE RELATED PRESSURE",
    "DIABETIC SKIN ULCER (FOOT)",
    "DIABETIC SKIN ULCER (NON-FOOT)",
    "BURN",
    "STOMA",
    "FISTULA/SINUS TRACT",
    "DERMATOLOLICAL",
    "CALCIPHYLAXIS",
    "NOT A WOUND",
    "RADIATION WOUND",
    "EDEMA RELATED"
]

class WoundImageScraper:
    def __init__(self, output_dir="wound_images", max_images_per_category=100):
        self.output_dir = Path(output_dir)
        self.max_images = max_images_per_category
        self.output_dir.mkdir(exist_ok=True)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def sanitize_filename(self, name):
        """Convert etiology name to valid filename"""
        return name.lower().replace(" ", "_").replace("/", "_").replace("(", "").replace(")", "")

    def get_search_queries(self, etiology):
        """Generate multiple high-quality search queries for each wound type"""
        etiology_lower = etiology.lower()

        # Focus on actual patient photos with skin wounds
        queries = [
            f"{etiology_lower} patient skin wound photo",
            f"{etiology_lower} wound on skin clinical photograph",
            f"{etiology_lower} wound patient case study image",
        ]

        # Add specific queries for different wound types
        if "bite" in etiology_lower:
            queries = [
                f"{etiology_lower} wound on skin patient",
                f"{etiology_lower} injury human skin photo",
                f"{etiology_lower} wound dermatology patient case"
            ]
        elif "diabetic" in etiology_lower:
            queries = [
                f"diabetic foot ulcer patient skin photo",
                f"diabetes wound patient foot image",
                f"diabetic ulcer patient case photo"
            ]
        elif "pressure" in etiology_lower:
            queries = [
                f"pressure ulcer patient skin stage photo",
                f"bedsore patient skin clinical image",
                f"decubitus ulcer patient wound photo"
            ]
        elif "burn" in etiology_lower:
            queries = [
                f"burn wound patient skin photo",
                f"thermal burn injury patient image",
                f"burn patient skin wound clinical"
            ]
        elif "surgical" in etiology_lower:
            queries = [
                f"surgical wound patient skin photo",
                f"post operative wound patient image",
                f"surgical incision patient skin photo"
            ]
        elif "ulcer" in etiology_lower:
            queries = [
                f"skin ulcer patient wound photo",
                f"chronic ulcer patient skin image",
                f"ulcer wound patient clinical photo"
            ]

        return queries[:3]  # Limit to 3 queries per etiology

    def scrape_google_images(self, query, category, max_images):
        """Scrape images from Google Images using Custom Search API"""
        print(f"\n🔍 Searching for: {query}")

        # Create category directory
        category_dir = self.output_dir / self.sanitize_filename(category)
        category_dir.mkdir(exist_ok=True)

        # You'll need to set these environment variables:
        # GOOGLE_API_KEY - Get from https://console.cloud.google.com/apis/credentials
        # GOOGLE_CSE_ID - Get from https://programmablesearchengine.google.com/
        api_key = os.getenv('GOOGLE_API_KEY')
        cse_id = os.getenv('GOOGLE_CSE_ID')

        if not api_key or not cse_id:
            print("⚠️  Google API credentials not set. Using alternative method...")
            return self.scrape_bing_images(query, category, max_images)

        images_downloaded = 0
        start_index = 1

        while images_downloaded < max_images:
            # Google Custom Search API endpoint
            url = f"https://www.googleapis.com/customsearch/v1"
            params = {
                'key': api_key,
                'cx': cse_id,
                'q': query,
                'searchType': 'image',
                'start': start_index,
                'num': min(10, max_images - images_downloaded),
                'imgSize': 'large',  # Only large images
                'imgType': 'photo',  # Only photos
                'safe': 'off'  # Don't filter medical images
            }

            try:
                response = requests.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()

                if 'items' not in data:
                    print(f"No more images found for {category}")
                    break

                for idx, item in enumerate(data['items']):
                    if images_downloaded >= max_images:
                        break

                    image_url = item['link']
                    file_ext = Path(image_url).suffix or '.jpg'
                    filename = f"{self.sanitize_filename(category)}_{images_downloaded + 1}{file_ext}"
                    filepath = category_dir / filename

                    if self.download_image(image_url, filepath):
                        images_downloaded += 1
                        print(f"  ✅ Downloaded {images_downloaded}/{max_images}: {filename}")

                    time.sleep(0.5)  # Be respectful with requests

                start_index += 10

            except requests.exceptions.RequestException as e:
                print(f"  ❌ Error fetching from Google: {e}")
                break
            except Exception as e:
                print(f"  ❌ Unexpected error: {e}")
                break

        print(f"✅ Downloaded {images_downloaded} images for {category}")
        return images_downloaded

    def scrape_bing_images(self, query, category, max_images):
        """Scrape images from Bing Image Search API"""
        print(f"\n🔍 Searching Bing for: {query}")

        category_dir = self.output_dir / self.sanitize_filename(category)
        category_dir.mkdir(exist_ok=True)

        # Get Bing API key from https://portal.azure.com/
        api_key = os.getenv('BING_API_KEY')

        if not api_key:
            print("⚠️  Bing API key not set. Skipping...")
            return 0

        endpoint = "https://api.bing.microsoft.com/v7.0/images/search"
        headers = {"Ocp-Apim-Subscription-Key": api_key}

        images_downloaded = 0
        offset = 0

        while images_downloaded < max_images:
            params = {
                "q": query,
                "count": min(50, max_images - images_downloaded),
                "offset": offset,
                "imageType": "Photo",
                "safeSearch": "Moderate"
            }

            try:
                response = requests.get(endpoint, headers=headers, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()

                if 'value' not in data or len(data['value']) == 0:
                    print(f"No more images found for {category}")
                    break

                for item in data['value']:
                    if images_downloaded >= max_images:
                        break

                    image_url = item['contentUrl']
                    file_ext = Path(image_url).suffix.split('?')[0] or '.jpg'
                    filename = f"{self.sanitize_filename(category)}_{images_downloaded + 1}{file_ext}"
                    filepath = category_dir / filename

                    if self.download_image(image_url, filepath):
                        images_downloaded += 1
                        print(f"  ✅ Downloaded {images_downloaded}/{max_images}: {filename}")

                    time.sleep(0.3)

                offset += len(data['value'])

            except requests.exceptions.RequestException as e:
                print(f"  ❌ Error fetching from Bing: {e}")
                break
            except Exception as e:
                print(f"  ❌ Unexpected error: {e}")
                break

        print(f"✅ Downloaded {images_downloaded} images for {category}")
        return images_downloaded

    def download_image(self, url, filepath):
        """Download a single image"""
        try:
            response = requests.get(url, headers=self.headers, timeout=10, stream=True)
            response.raise_for_status()

            # Check if it's actually an image
            content_type = response.headers.get('content-type', '')
            if 'image' not in content_type.lower():
                return False

            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            return True

        except Exception as e:
            # print(f"    ⚠️  Failed to download {url}: {e}")
            return False

    def scrape_all_categories(self):
        """Scrape images for all wound categories"""
        print("=" * 60)
        print("🏥 WOUND IMAGE SCRAPER")
        print("=" * 60)
        print(f"📁 Output directory: {self.output_dir.absolute()}")
        print(f"📊 Categories: {len(WOUND_ETIOLOGIES)}")
        print(f"🎯 Target images per category: {self.max_images}")
        print("=" * 60)

        results = {}

        for idx, etiology in enumerate(WOUND_ETIOLOGIES, 1):
            print(f"\n[{idx}/{len(WOUND_ETIOLOGIES)}] Processing: {etiology}")

            # Create better search queries for actual medical wound images
            search_queries = self.get_search_queries(etiology)

            count = 0
            for search_query in search_queries:
                if count >= self.max_images:
                    break

                remaining = self.max_images - count
                result = self.scrape_google_images(search_query, etiology, remaining)
                count += result

                if count >= self.max_images:
                    break

            if count < self.max_images:
                print(f"  ℹ️  Only got {count} images from primary source, trying alternative...")
                additional = self.scrape_bing_images(search_query, etiology, self.max_images - count)
                count += additional

            results[etiology] = count

            # Add delay between categories
            time.sleep(2)

        # Print summary
        print("\n" + "=" * 60)
        print("📊 SCRAPING SUMMARY")
        print("=" * 60)

        total_images = 0
        for etiology, count in results.items():
            print(f"  {etiology}: {count} images")
            total_images += count

        print("=" * 60)
        print(f"✅ Total images downloaded: {total_images}")
        print(f"📁 Saved to: {self.output_dir.absolute()}")
        print("=" * 60)

        # Save results to JSON
        results_file = self.output_dir / "scraping_results.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)

        print(f"\n💾 Results saved to: {results_file}")

def main():
    """Main function"""
    import argparse

    parser = argparse.ArgumentParser(description='Scrape wound images for training')
    parser.add_argument('--output', '-o', default='wound_images',
                       help='Output directory (default: wound_images)')
    parser.add_argument('--max-images', '-m', type=int, default=100,
                       help='Maximum images per category (default: 100)')
    parser.add_argument('--category', '-c', type=str,
                       help='Scrape only a specific category')

    args = parser.parse_args()

    scraper = WoundImageScraper(
        output_dir=args.output,
        max_images_per_category=args.max_images
    )

    if args.category:
        if args.category.upper() in WOUND_ETIOLOGIES:
            print(f"Scraping single category: {args.category}")
            query = f"medical {args.category} wound clinical photo"
            scraper.scrape_google_images(query, args.category, args.max_images)
        else:
            print(f"❌ Category '{args.category}' not found in etiology list")
            print(f"Available categories: {', '.join(WOUND_ETIOLOGIES)}")
    else:
        scraper.scrape_all_categories()

if __name__ == "__main__":
    main()
