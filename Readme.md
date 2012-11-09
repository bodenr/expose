
# expose

A [node.js](http://nodejs.org) module allowing you to search and
expose module `exports` onto a given namespace. This can be useful
for example if you want to organize functions in respective modules
(js files) but expose all of them onto a single index module for 
easier consumability.

## Status

Under development, but usable.
- Currently there is an issue if you use `require` expose from 2 different
modules and let it default to the `lib` target. This can be worked around
by passing in the `targets` explicitly and only applies when `required` from
different modules.

## License

(The MIT License)

Copyright (c) 2012 Boden Russell &lt;bodensemail@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
