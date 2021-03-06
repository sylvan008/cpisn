const fetch = require('node-fetch');
const defaultPages = require('./data.json');

class Cpisn {
  constructor(pages, useDefaultPages = true, fetchOptions = {}) {
    this._pages = useDefaultPages ? defaultPages : [];
    this._fetchOptions = fetchOptions;

    if (pages) {
      this.addPages(pages);
    }
  }

  /**
   * Set pages
   * @param {Array} pages
   */
  setPages(pages) {
    this._pages = this._copyArray(pages);
  }

  /**
   * Add more pages
   * @param {Array} pages
   */
  addPages(pages) {
    const keys = {};
    this._pages = [...this._copyArray(pages), ...this._pages]
      .filter(page => {
        if (keys[page.name]) {
          return false;
        }
        keys[page.name] = true;
        return true;
      });
  }

  /**
   * Get list of pages
   * @returns {Array}
   */
  getPages() {
    return this._copyArray(this._pages);
  }

  /**
   * G
   * @param {string} nickname
   * @returns {{result: Promise, page: Object, url: string}[]}
   */
  getQueries(nickname) {
    return this._pages.map(page => {
      let url = page.url.replace('{}', nickname);

      return {
        page,
        url,
        result: fetch(url, this._fetchOptions)
          .then(async res => {
            const result = {
              pageIsFound: false,
              res,
              body: '',
            };
            // status code
            if (res.status === 404 || res.status === 0) {
              return result;
            }

            const body = await res.text();
            result.body = body;

            // customs error
            if (page.error) {
              if (page.error.body && body.trim() === page.error.body) {
                return result;
              }

              if (page.error.body_includes && body.includes(page.error.body_includes)) {
                return result;
              }

              if (page.error.body_does_not_includes && !body.includes(page.error.body_does_not_includes)) {
                return result;
              }
            }

            result.pageIsFound = true;
            return result;
          }),
      };
    });
  }

  /**
   * Just deep copy arr
   * @param arr
   * @returns {Array}
   * @private
   */
  _copyArray(arr) {
    try {
      return JSON.parse(JSON.stringify(arr));
    } catch (e) {
      return [];
    }
  }

}

module.exports = Cpisn;
