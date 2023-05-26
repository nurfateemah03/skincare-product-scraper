// API set up
const PORT = process.env.PORT || 8000;
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

 // Maximum number of pages to fetch
const PAGE_LIMIT = 70;

//Website that is being scraped
const websites = [
  {
    name: 'Sephora',
    address: 'https://www.sephora.ae/en/shop/skincare-c303/',
    base: '',
  },
];

//Array to store all the products
const articles = [];

//function that looks for products while scrolling the website
function scrollAndScrapeWebsite(url, page =1) {
    const pageUrl = `${url}?page=${page}`;

    // start using axios and cheerio
    return axios.get(pageUrl).then((response) => {
    const html = response.data;
    const $ = cheerio.load(html);

    // looks in the a tag of html code to find name, urls, descriptions, and prices
    $('a', html).each(function () {

      //Brand name
        const brandElement = $(this).find('.product-brand');
        const brandName = brandElement.text().trim();
        //Description
        const descriptionElement = $(this).find('.summarize-description.title-line-bold');
        const description = descriptionElement.text().trim();
        //URL
        const url = $(this).attr('href');;
        //price formatiing
        const parentDiv = $(this).parent('div');
        const priceElement = parentDiv.find('.product-pricing');
        let priceinAED = priceElement.text().trim();
        priceinAED = priceinAED.replace(/[^0-9.]/g, '');
        priceinAED = priceinAED.replace(/(\..*?)\./g, '$1'); 
        const roundedPrice = parseFloat(priceinAED).toFixed(2);

      // check if there are duplicate products
       if (brandName ) {
        const duplicateIndex = articles.findIndex(
          (article) => article.brandName === brandName && article.description === description
        );

// if not then push into the array
        if (duplicateIndex === -1) {
          articles.push({
            brandName,
            url,
            priceinAED: roundedPrice,
            description,
          });
        }
      }
    });
  
    //works with the infinite scrolling of a website
    if (page < PAGE_LIMIT) {
      const nextPage = page + 1;
      return scrollAndScrapeWebsite(url, nextPage);
    }

    return null; 
  });
}

//if it is succesful it will return scraping completed
function fetchProducts() {
    websites.forEach((website) => {
        scrollAndScrapeWebsite(website.address).then(() => {
        if (website === websites[websites.length - 1]) {
          console.log('Scraping completed.');
        }
      });
    });
  }

  // main page of api, welcome page
app.get('/', (req, res) => {
  res.json('Welcome to my SkinCare News API');
});

// where to find all the products
app.get('/products', (req, res) => {
  res.json(articles);
});

//if user wants to check a specific brand
app.get('/products/:brandID', (req, res) => {
  const brandID = req.params.brandID;
  const filteredArticles = articles.filter((article) => article.brandName.toLowerCase().includes(brandID.toLowerCase()));

  res.json(filteredArticles);
});

//run 
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
  fetchProducts(); // Start fetching products when the server starts
});
