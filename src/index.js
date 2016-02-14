/**
 * Copyright (c) 2016 Shawn Dellysse
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const createParameterizeFunction (route) {
    // Extract the name from the route
    const names = (route.path.match(/:[$_A-Za-z][$_0-9A-Za-z]+/g) || []).map(v => v.substr(1));

    // Create a value extraction regex by replacing the names inside the
    // path with capture groups.
    let regexString = route.path;
    regexString = regexString.replace(/:[^\/]+/g, "([^/]*)");
    if (/\*$/.test(regexString)) {
        regexString = regexString.replace(/\*$/, "(.*)");
        names.push("_rest");
    }
    const regexp = new RegExp(`^${ regexString }$`);

    return (req) => {
        const values = (regexp.exec(req.path) || []).slice(1);

        if (names.length !== values.length) {
            throw new Error("There is a mismatch between the number of names and the number of values.");
        }

        req.params = {};
        for (let i = 0, l = route.names.length; i < l; i++) {
            req.params[route.names[i]] = values[i];
        }
    };
};

const parameterizeFunctions = new WeakMap();
module.exports = {
    name: "query-parameter-parser",
    respondsTo: "then",
    callback: (req, res) => {
        let parameterize = parameterizeFunctions.get(req.route);

        if (parameterize == null) {
            parameterize = createParameterizeFunction(req.route);
            parameterizeFunctions.set(req.route, parameterize);
        }

        parameterize(req);
    },
};
