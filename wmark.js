function wmark() {
    this.convert = function (src) {
        REFERENCE = new Map();
        var root = new Node(src, "root");
        handleRoot(root);
        for (i = 0; i < root.children.length; i++) {
            buildInlineItem(root.children[i]);
        }
        //console.log(nodeToHTML(root));
        return nodeToHTML(root);
    }

    function Node(text, type) {
        this.text = text;
        this.lines = text.split('\n');
        this.attribute = {};
        this.children = [];
        this.type = type || "unknown";
    }

    {
        // public variable and function

        function isBlankline(line) {
            return /^[ ]{0,3}$/.test(line);
        }

        // escape special characters
        function esSpecialCharacters(text) {
            return text.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }

        // return the last item of an array
        function myLast(array) {
            return array[array.length - 1];
        }

        function myFor(array, f) {
            for (var i = 0; i < array.length; i++) {
                f(array[i], i);
            }
        }

        function mySum(list, plucker) {
            var transform = {
                'undefined': function (obj) {
                    return obj;
                },
                'string': function (obj) {
                    return obj[plucker];
                },
                'number': function (obj) {
                    return obj[plucker];
                },
                'function': plucker
            } [typeof plucker];
            var summation = 0;
            for (var i = 0; i < list.length; i++) {
                summation += transform(list[i]);
            }
            return summation;
        }

        function myMax(a) {
            if (a.length === 0)
                return null;
            var res = a[0];
            for (var i = 0; i < a.length; i++)
                res = (res > a[i] ? res : a[i]);
            return res;
        }

        function myMin(a) {
            if (a.length === 0)
                return null;
            var res = a[0];
            for (var i = 0; i < a.length; i++)
                res = (res < a[i] ? res : a[i]);
            return res;
        }

        function myIndexBy(list, key) {
            var o = {};
            for (var i = 0; i < list.length; i++)
                o[list[i][key]] = list[i];
            return o;
        }

        function nodeToHTML(node) {
            switch (node.type) {
                case 'unknown':
                    return nthHelp('', true, true);
                case 'setextHeader':
                case 'atxHeader':
                    return nthHelp('h' + node.level, true, true);
                case 'blockQuote':
                    return nthHelp('blockquote', true, true);
                case 'unorderedList':
                    return nthHelp('ul', true, true);
                case 'orderedList':
                    return nthHelp('ol', true, true);
                case 'listitem':
                    return nthHelp('li', true, true);
                case 'code':
                    return nthHelp('code', false, true);
                case 'pre':
                    return nthHelp('pre', true, false);
                case 'horizontal':
                    return '<hr />';
                case 'html':
                    return node.text;
                case 'uml':
                    return node.output;
                case 'reference':
                    return '';
                case 'paragraph':
                    return nthHelp('p', true, true);
                case 'root':
                    return nthHelp('', true, true);

                case 'asciimath':
                    switch (node.tag) {
                        case 'notag':
                            return node.text;
                        case 'frag':
                            return nthHelp('', true, true);
                        default:
                            return nthHelp(node.tag, true, false);
                    }

                case 'inlineComplicated':
                    return nthHelp('', true, false);
                case 'inlineVideo':
                    return nthHelp('video', true, false);
                case 'inlineImage':
                    return nthHelp('img', true, false);
                case 'inlineLink':
                    return nthHelp('a', true, false);
                case 'inlineReference':
                    return nthHelp('a', true, false);
                case 'inlineStrong':
                    return nthHelp('strong', true, false);
                case 'inlineEm':
                    return nthHelp('em', true, false);
                case 'inlineCode':
                    return nthHelp('code', false, false);
                case 'inlineAsciiMath':
                    return nthHelp('math', true, true);
                case 'inlinePure':
                    return node.text;
            }

            // the help function of NodeToHTML
            function nthHelp(tag, rec, wrap) {
                var res = '';
                var e = (wrap === true ? '\n' : '');
                if (rec === true) {
                    for (var i in node.children) {
                        res += nodeToHTML(node.children[i]);
                        if (parseInt(i) !== node.children.length - 1)
                            res += e;
                    }
                } else {
                    res = node.text;
                }
                if (tag !== '') {
                    var head = '';
                    head += '<' + tag;
                    for (var j in node.attribute) {
                        head += ' ' + j + '="' + node.attribute[j] + '"';
                    }
                    head += '>';
                    res = head + res;
                    res = res + '</' + tag + '>';
                }
                return res;
            }
        }

        var REFERENCE;
        var ASCIIMATH = null;
        var UML = null;
    }

    function checkBlockItemType(node) {
        var typers = {
            'setextHeader': /^.+\n(=+|-+)$/,
            'atxHeader': /^[#]{1,6} \S+/,
            'blockQuote': /^> .+/,
            'unorderedList': /^[*+-][ ]{3}\S+/,
            'orderedList': /^\d\.[ ]{2}\S+/,
            'code': /^[ ]{4}\S+/,
            'horizontal': /^[*-_](\s*[*-_]){2,}/,
            'html': /^<(\s|\S)+>$/,
            'uml': /^@startUML/,
            'reference': /^\[.+\]:.+/,
            'paragraph': /^(\S|\s)*$/
        };

        for (var index in typers) {
            if (typers[index].test(node.text) === true) {
                node.type = index;
                break;
            }
        }
    }

    function handleRoot(node) {
        var src = "";
        var i;

        for (i = 0; i <= node.lines.length; i++) {
            if (i === node.lines.length || isBlankline(node.lines[i])) {
                if (src !== "") {
                    var child = new Node(src);
                    buildBlockItem(child);
                    src = "";
                    node.children.push(child);
                }
            } else {
                if (src !== "")
                    src += "\n";
                src += node.lines[i];
            }
        }
    }

    function buildBlockItem(node) {
        var i;
        var src, listitem;

        checkBlockItemType(node);

        switch (node.type) {
            case 'paragraph':
                break;
            case 'setextHeader':
                node.title = node.lines[0];
                node.level = (node.lines[1][0] === '=' ? 1 : 2);
                break;
            case 'atxHeader':
                node.title = node.text.match(/\S+/g)[1];
                node.level = node.text.match(/\S+/g)[0].length;
                break;
            case 'blockQuote':
                node.text = "";
                for (i in node.lines) {
                    node.lines[i] = node.lines[i].replace(/^> /, "");
                    if (node.text !== "")
                        node.text += "\n";
                    node.text += node.lines[i];
                }
                handleRoot(node);
                break;
            case 'orderedList':
                src = "";
                for (i in node.lines) {
                    if (/^\d\.[ ]{2}/.test(node.lines[i])) {
                        if (src !== "") {
                            listitem = new Node(src, "listitem");
                            handleRoot(listitem);
                            node.children.push(listitem);
                            src = "";
                        }
                        if (src !== "")
                            src += "\n";
                        src += node.lines[i].replace(/^\d\.[ ]{2}/, "");
                    } else {
                        if (src !== "")
                            src += "\n";
                        src += node.lines[i].replace(/^[ ]{4}/, "");
                    }
                }
                if (src !== "") {
                    listitem = new Node(src, "listitem");
                    handleRoot(listitem);
                    node.children.push(listitem);
                    src = "";
                }
                break;
            case 'unorderedList':
                src = "";
                for (i in node.lines) {
                    if (/^[*+-][ ]{3}/.test(node.lines[i])) {
                        if (src !== "") {
                            listitem = new Node(src, "listitem");
                            handleRoot(listitem);
                            node.children.push(listitem);
                            src = "";
                        }
                        if (src !== "")
                            src += "\n";
                        src += node.lines[i].replace(/^[*+-][ ]{3}/, "");
                    } else {
                        if (src !== "")
                            src += "\n";
                        src += node.lines[i].replace(/^[ ]{4}/, "");
                    }
                }
                if (src !== "") {
                    listitem = new Node(src, "listitem");
                    handleRoot(listitem);
                    node.children.push(listitem);
                    src = "";
                }
                break;
            case 'code':
                node.text = "";
                node.type = 'pre';
                for (i in node.lines) {
                    node.lines[i] = node.lines[i].replace(/^    /, "");
                    if (node.text != "")
                        node.text += "\n";
                    node.text += node.lines[i];
                }
                var code = new Node(esSpecialCharacters(node.text), 'code');
                node.children.push(code);
                node.text = "";
                node.lines = node.text.split('\n');
                break;
            case 'horizontal':
            case 'html':
                break;
            case 'uml':
                node.text = node.text.replace(/^@startUML\n/, "");
                node.lines = node.text.split("\n");
                handleUML(node);
                break;
            case 'reference':
                node.text = node.text.replace(/^\[(.+)\]:(.+)/, "$1 $2");
                var parts = node.text.split(' ');
                REFERENCE.set(parts[0], parts[1]);
                break;
            default:
                break;
        }
    }

    function buildInlineItem(node) {
        switch (node.type) {
            case 'blockQuote':
            case 'unorderedList':
            case 'orderedList':
            case 'listitem':
                for (var i = 0; i < node.children.length; i++) {
                    buildInlineItem(node.children[i]);
                }
                break;

            case 'setextHeader':
            case 'atxHeader':
                var child = new Node(node.title, 'inlineComplicated');
                splitComplicated(child);
                node.children.push(child);
                break;
            case 'paragraph':
                for (var i in node.lines) {
                    var child = new Node(node.lines[i], 'inlineComplicated');
                    splitComplicated(child);
                    node.children.push(child);
                }
                break;

            case 'code':
            case 'horizontal':
            case 'html':
            case 'uml':
            case 'reference':
            case 'unknown':
            default:
                break;
        }
    }

    function splitComplicated(node) {
        var typers = {
            "inlineVideo": /\?\[.+\]\(.+\)/,
            "inlineImage": /\!\[.+\]\(.+\)/,
            "inlineLink": /\[.+\]\(.+\)/,
            "inlineReference": /\[.+\]\[.+\]/,
            "inlineStrong": /\*\*\S+\*\*/,
            "inlineEm": /\*\S+\*/,
            "inlineCode": /`.+`/,
            "inlineAsciiMath": /\&.+\&/
        };

        for (var i in typers) {
            if (typers[i].test(node.text) === true) {
                var part1, part2, part3;
                var src;
                var m = node.text.match(typers[i]);

                src = node.text.slice(0, m.index);
                if (src !== '') {
                    part1 = new Node(src, 'inlineComplicated');
                    splitComplicated(part1);
                    node.children.push(part1);
                }

                src = m[0];
                part2 = new Node(src, i);
                var separate = "!!!!";
                var parts, child;
                switch (part2.type) {
                    case 'inlineVideo':
                        part2.text = part2.text.replace(/\?\[(.+)\]\((.+)\)/, "$1" + separate + "$2");
                        parts = part2.text.split(separate);
                        part2.attribute.alt = parts[0];
                        part2.attribute.src = parts[1];
                        break;
                    case 'inlineImage':
                        part2.text = part2.text.replace(/\!\[(.+)\]\((.+)\)/, "$1" + separate + "$2");
                        parts = part2.text.split(separate);
                        part2.attribute.alt = parts[0];
                        part2.attribute.src = parts[1];
                        break;
                    case 'inlineLink':
                        part2.text = part2.text.replace(/\[(.+)\]\((.+)\)/, "$1" + separate + "$2");
                        parts = part2.text.split(separate);
                        part2.alt = parts[0];
                        part2.attribute.href = parts[1];
                        child = new Node(part2.alt, 'inlineComplicated');
                        splitComplicated(child);
                        part2.children.push(child);
                        break;
                    case 'inlineReference':
                        part2.text = part2.text.replace(/\[(.+)\]\[(.+)\]/, "$1" + separate + "$2");
                        parts = part2.text.split(separate);
                        part2.alt = parts[0];
                        part2.attribute.href = REFERENCE.get(parts[1]) || "./";
                        child = new Node(part2.alt, 'inlineComplicated');
                        splitComplicated(child);
                        part2.children.push(child);
                        break;
                    case 'inlineEm':
                        part2.text = part2.text.replace(/\*(\S+)\*/, "$1");
                        child = new Node(part2.text, 'inlineComplicated');
                        splitComplicated(child);
                        part2.children.push(child);
                        break;
                    case 'inlineStrong':
                        part2.text = part2.text.replace(/\*\*(\S+)\*\*/, "$1");
                        child = new Node(part2.text, 'inlineComplicated');
                        splitComplicated(child);
                        part2.children.push(child);
                        break;
                    case 'inlineCode':
                        part2.text = esSpecialCharacters(part2.text.replace(/`(.+)`/, "$1"));
                        break;
                    case 'inlineAsciiMath':
                        part2.text = part2.text.replace(/\&(.+)\&/, "$1");
                        handleAsciiMath(part2);
                        break;
                    default:
                        break;
                }
                node.children.push(part2);

                src = node.text.slice(m.index + m[0].length, );
                if (src !== '') {
                    part3 = new Node(src, 'inlineComplicated');
                    splitComplicated(part3);
                    node.children.push(part3);
                }

                return;
            }
        }
        node.text = node.text.replace(/[ ]{2,}$/, '<br />');
        node.type = 'inlinePure';
    }

    function handleAsciiMath(node) {
        if (ASCIIMATH === null) {
            ASCIIMATH = new AsciiMath();
            ASCIIMATH.initSymbols();
        }
        node.children.push(ASCIIMATH.translate(node.text));
    }

    function AsciiMath() {
        this.initSymbols = function () {
            var i;
            for (i = 0; i < symbols.length; i++) {
                if (symbols[i].tex) {
                    symbols.push({
                        input: symbols[i].tex,
                        tag: symbols[i].tag,
                        output: symbols[i].output,
                        ttype: symbols[i].ttype,
                        acc: (symbols[i].acc || false)
                    });
                }
            }
            symbols.sort(compareNames);
            for (i = 0; i < symbols.length; i++){
                names[i] = symbols[i].input;
            }
        }
        this.translate = function (str) {
            nestingDepth = 0;
            return parseExpr(str, false)[0];
        }

        function createMathNode(text, tag, child) {
            var node = new Node(text, "asciimath");
            node.tag = tag;
            if (child)
                appendChild(node, child);
            return node;
        }

        {
            var fixphi = true;
            var AMcal = ["\uD835\uDC9C", "\u212C", "\uD835\uDC9E", "\uD835\uDC9F", "\u2130", "\u2131", "\uD835\uDCA2", "\u210B", "\u2110", "\uD835\uDCA5", "\uD835\uDCA6", "\u2112", "\u2133", "\uD835\uDCA9", "\uD835\uDCAA", "\uD835\uDCAB", "\uD835\uDCAC", "\u211B", "\uD835\uDCAE", "\uD835\uDCAF", "\uD835\uDCB0", "\uD835\uDCB1", "\uD835\uDCB2", "\uD835\uDCB3", "\uD835\uDCB4", "\uD835\uDCB5", "\uD835\uDCB6", "\uD835\uDCB7", "\uD835\uDCB8", "\uD835\uDCB9", "\u212F", "\uD835\uDCBB", "\u210A", "\uD835\uDCBD", "\uD835\uDCBE", "\uD835\uDCBF", "\uD835\uDCC0", "\uD835\uDCC1", "\uD835\uDCC2", "\uD835\uDCC3", "\u2134", "\uD835\uDCC5", "\uD835\uDCC6", "\uD835\uDCC7", "\uD835\uDCC8", "\uD835\uDCC9", "\uD835\uDCCA", "\uD835\uDCCB", "\uD835\uDCCC", "\uD835\uDCCD", "\uD835\uDCCE", "\uD835\uDCCF"];
            var AMfrk = ["\uD835\uDD04", "\uD835\uDD05", "\u212D", "\uD835\uDD07", "\uD835\uDD08", "\uD835\uDD09", "\uD835\uDD0A", "\u210C", "\u2111", "\uD835\uDD0D", "\uD835\uDD0E", "\uD835\uDD0F", "\uD835\uDD10", "\uD835\uDD11", "\uD835\uDD12", "\uD835\uDD13", "\uD835\uDD14", "\u211C", "\uD835\uDD16", "\uD835\uDD17", "\uD835\uDD18", "\uD835\uDD19", "\uD835\uDD1A", "\uD835\uDD1B", "\uD835\uDD1C", "\u2128", "\uD835\uDD1E", "\uD835\uDD1F", "\uD835\uDD20", "\uD835\uDD21", "\uD835\uDD22", "\uD835\uDD23", "\uD835\uDD24", "\uD835\uDD25", "\uD835\uDD26", "\uD835\uDD27", "\uD835\uDD28", "\uD835\uDD29", "\uD835\uDD2A", "\uD835\uDD2B", "\uD835\uDD2C", "\uD835\uDD2D", "\uD835\uDD2E", "\uD835\uDD2F", "\uD835\uDD30", "\uD835\uDD31", "\uD835\uDD32", "\uD835\uDD33", "\uD835\uDD34", "\uD835\uDD35", "\uD835\uDD36", "\uD835\uDD37"];
            var AMbbb = ["\uD835\uDD38", "\uD835\uDD39", "\u2102", "\uD835\uDD3B", "\uD835\uDD3C", "\uD835\uDD3D", "\uD835\uDD3E", "\u210D", "\uD835\uDD40", "\uD835\uDD41", "\uD835\uDD42", "\uD835\uDD43", "\uD835\uDD44", "\u2115", "\uD835\uDD46", "\u2119", "\u211A", "\u211D", "\uD835\uDD4A", "\uD835\uDD4B", "\uD835\uDD4C", "\uD835\uDD4D", "\uD835\uDD4E", "\uD835\uDD4F", "\uD835\uDD50", "\u2124", "\uD835\uDD52", "\uD835\uDD53", "\uD835\uDD54", "\uD835\uDD55", "\uD835\uDD56", "\uD835\uDD57", "\uD835\uDD58", "\uD835\uDD59", "\uD835\uDD5A", "\uD835\uDD5B", "\uD835\uDD5C", "\uD835\uDD5D", "\uD835\uDD5E", "\uD835\uDD5F", "\uD835\uDD60", "\uD835\uDD61", "\uD835\uDD62", "\uD835\uDD63", "\uD835\uDD64", "\uD835\uDD65", "\uD835\uDD66", "\uD835\uDD67", "\uD835\uDD68", "\uD835\uDD69", "\uD835\uDD6A", "\uD835\uDD6B"];
            var CONST = 0,
                UNARY = 1,
                BINARY = 2,
                INFIX = 3,
                LEFTBRACKET = 4,
                RIGHTBRACKET = 5,
                SPACE = 6,
                UNDEROVER = 7,
                DEFINITION = 8,
                LEFTRIGHT = 9,
                TEXT = 10,
                BIG = 11,
                LONG = 12,
                STRETCHY = 13,
                MATRIX = 14,
                UNARYUNDEROVER = 15;
            var quote = {
                input: "\"",
                tag: "mtext",
                output: "mbox",
                tex: null,
                ttype: TEXT
            };
            var symbols = [
                //some greek symbols
                {
                    input: "alpha",
                    tag: "mi",
                    output: "\u03B1",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "beta",
                    tag: "mi",
                    output: "\u03B2",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "chi",
                    tag: "mi",
                    output: "\u03C7",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "delta",
                    tag: "mi",
                    output: "\u03B4",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "Delta",
                    tag: "mo",
                    output: "\u0394",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "epsi",
                    tag: "mi",
                    output: "\u03B5",
                    tex: "epsilon",
                    ttype: CONST
                },
                {
                    input: "varepsilon",
                    tag: "mi",
                    output: "\u025B",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "eta",
                    tag: "mi",
                    output: "\u03B7",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "gamma",
                    tag: "mi",
                    output: "\u03B3",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "Gamma",
                    tag: "mo",
                    output: "\u0393",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "iota",
                    tag: "mi",
                    output: "\u03B9",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "kappa",
                    tag: "mi",
                    output: "\u03BA",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "lambda",
                    tag: "mi",
                    output: "\u03BB",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "Lambda",
                    tag: "mo",
                    output: "\u039B",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "lamda",
                    tag: "mi",
                    output: "\u03BB",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "Lamda",
                    tag: "mo",
                    output: "\u039B",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "mu",
                    tag: "mi",
                    output: "\u03BC",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "nu",
                    tag: "mi",
                    output: "\u03BD",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "omega",
                    tag: "mi",
                    output: "\u03C9",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "Omega",
                    tag: "mo",
                    output: "\u03A9",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "phi",
                    tag: "mi",
                    output: fixphi ? "\u03D5" : "\u03C6",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "varphi",
                    tag: "mi",
                    output: fixphi ? "\u03C6" : "\u03D5",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "Phi",
                    tag: "mo",
                    output: "\u03A6",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "pi",
                    tag: "mi",
                    output: "\u03C0",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "Pi",
                    tag: "mo",
                    output: "\u03A0",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "psi",
                    tag: "mi",
                    output: "\u03C8",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "Psi",
                    tag: "mi",
                    output: "\u03A8",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "rho",
                    tag: "mi",
                    output: "\u03C1",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "sigma",
                    tag: "mi",
                    output: "\u03C3",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "Sigma",
                    tag: "mo",
                    output: "\u03A3",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "tau",
                    tag: "mi",
                    output: "\u03C4",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "theta",
                    tag: "mi",
                    output: "\u03B8",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "vartheta",
                    tag: "mi",
                    output: "\u03D1",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "Theta",
                    tag: "mo",
                    output: "\u0398",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "upsilon",
                    tag: "mi",
                    output: "\u03C5",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "xi",
                    tag: "mi",
                    output: "\u03BE",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "Xi",
                    tag: "mo",
                    output: "\u039E",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "zeta",
                    tag: "mi",
                    output: "\u03B6",
                    tex: null,
                    ttype: CONST
                },

                //binary operation symbols
                //{input:"-",  tag:"mo", output:"\u0096", tex:null, ttype:CONST},
                {
                    input: "*",
                    tag: "mo",
                    output: "\u22C5",
                    tex: "cdot",
                    ttype: CONST
                },
                {
                    input: "**",
                    tag: "mo",
                    output: "\u2217",
                    tex: "ast",
                    ttype: CONST
                },
                {
                    input: "***",
                    tag: "mo",
                    output: "\u22C6",
                    tex: "star",
                    ttype: CONST
                },
                {
                    input: "//",
                    tag: "mo",
                    output: "/",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "\\\\",
                    tag: "mo",
                    output: "\\",
                    tex: "backslash",
                    ttype: CONST
                },
                {
                    input: "setminus",
                    tag: "mo",
                    output: "\\",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "xx",
                    tag: "mo",
                    output: "\u00D7",
                    tex: "times",
                    ttype: CONST
                },
                {
                    input: "|><",
                    tag: "mo",
                    output: "\u22C9",
                    tex: "ltimes",
                    ttype: CONST
                },
                {
                    input: "><|",
                    tag: "mo",
                    output: "\u22CA",
                    tex: "rtimes",
                    ttype: CONST
                },
                {
                    input: "|><|",
                    tag: "mo",
                    output: "\u22C8",
                    tex: "bowtie",
                    ttype: CONST
                },
                {
                    input: "-:",
                    tag: "mo",
                    output: "\u00F7",
                    tex: "div",
                    ttype: CONST
                },
                {
                    input: "divide",
                    tag: "mo",
                    output: "-:",
                    tex: null,
                    ttype: DEFINITION
                },
                {
                    input: "@",
                    tag: "mo",
                    output: "\u2218",
                    tex: "circ",
                    ttype: CONST
                },
                {
                    input: "o+",
                    tag: "mo",
                    output: "\u2295",
                    tex: "oplus",
                    ttype: CONST
                },
                {
                    input: "ox",
                    tag: "mo",
                    output: "\u2297",
                    tex: "otimes",
                    ttype: CONST
                },
                {
                    input: "o.",
                    tag: "mo",
                    output: "\u2299",
                    tex: "odot",
                    ttype: CONST
                },
                {
                    input: "sum",
                    tag: "mo",
                    output: "\u2211",
                    tex: null,
                    ttype: UNDEROVER
                },
                {
                    input: "prod",
                    tag: "mo",
                    output: "\u220F",
                    tex: null,
                    ttype: UNDEROVER
                },
                {
                    input: "^^",
                    tag: "mo",
                    output: "\u2227",
                    tex: "wedge",
                    ttype: CONST
                },
                {
                    input: "^^^",
                    tag: "mo",
                    output: "\u22C0",
                    tex: "bigwedge",
                    ttype: UNDEROVER
                },
                {
                    input: "vv",
                    tag: "mo",
                    output: "\u2228",
                    tex: "vee",
                    ttype: CONST
                },
                {
                    input: "vvv",
                    tag: "mo",
                    output: "\u22C1",
                    tex: "bigvee",
                    ttype: UNDEROVER
                },
                {
                    input: "nn",
                    tag: "mo",
                    output: "\u2229",
                    tex: "cap",
                    ttype: CONST
                },
                {
                    input: "nnn",
                    tag: "mo",
                    output: "\u22C2",
                    tex: "bigcap",
                    ttype: UNDEROVER
                },
                {
                    input: "uu",
                    tag: "mo",
                    output: "\u222A",
                    tex: "cup",
                    ttype: CONST
                },
                {
                    input: "uuu",
                    tag: "mo",
                    output: "\u22C3",
                    tex: "bigcup",
                    ttype: UNDEROVER
                },

                //binary relation symbols
                {
                    input: "!=",
                    tag: "mo",
                    output: "\u2260",
                    tex: "ne",
                    ttype: CONST
                },
                {
                    input: ":=",
                    tag: "mo",
                    output: ":=",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "lt",
                    tag: "mo",
                    output: "<",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "<=",
                    tag: "mo",
                    output: "\u2264",
                    tex: "le",
                    ttype: CONST
                },
                {
                    input: "lt=",
                    tag: "mo",
                    output: "\u2264",
                    tex: "leq",
                    ttype: CONST
                },
                {
                    input: "gt",
                    tag: "mo",
                    output: ">",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: ">=",
                    tag: "mo",
                    output: "\u2265",
                    tex: "ge",
                    ttype: CONST
                },
                {
                    input: "gt=",
                    tag: "mo",
                    output: "\u2265",
                    tex: "geq",
                    ttype: CONST
                },
                {
                    input: "-<",
                    tag: "mo",
                    output: "\u227A",
                    tex: "prec",
                    ttype: CONST
                },
                {
                    input: "-lt",
                    tag: "mo",
                    output: "\u227A",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: ">-",
                    tag: "mo",
                    output: "\u227B",
                    tex: "succ",
                    ttype: CONST
                },
                {
                    input: "-<=",
                    tag: "mo",
                    output: "\u2AAF",
                    tex: "preceq",
                    ttype: CONST
                },
                {
                    input: ">-=",
                    tag: "mo",
                    output: "\u2AB0",
                    tex: "succeq",
                    ttype: CONST
                },
                {
                    input: "in",
                    tag: "mo",
                    output: "\u2208",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "!in",
                    tag: "mo",
                    output: "\u2209",
                    tex: "notin",
                    ttype: CONST
                },
                {
                    input: "sub",
                    tag: "mo",
                    output: "\u2282",
                    tex: "subset",
                    ttype: CONST
                },
                {
                    input: "sup",
                    tag: "mo",
                    output: "\u2283",
                    tex: "supset",
                    ttype: CONST
                },
                {
                    input: "sube",
                    tag: "mo",
                    output: "\u2286",
                    tex: "subseteq",
                    ttype: CONST
                },
                {
                    input: "supe",
                    tag: "mo",
                    output: "\u2287",
                    tex: "supseteq",
                    ttype: CONST
                },
                {
                    input: "-=",
                    tag: "mo",
                    output: "\u2261",
                    tex: "equiv",
                    ttype: CONST
                },
                {
                    input: "~=",
                    tag: "mo",
                    output: "\u2245",
                    tex: "cong",
                    ttype: CONST
                },
                {
                    input: "~~",
                    tag: "mo",
                    output: "\u2248",
                    tex: "approx",
                    ttype: CONST
                },
                {
                    input: "prop",
                    tag: "mo",
                    output: "\u221D",
                    tex: "propto",
                    ttype: CONST
                },

                //logical symbols
                {
                    input: "and",
                    tag: "mtext",
                    output: "and",
                    tex: null,
                    ttype: SPACE
                },
                {
                    input: "or",
                    tag: "mtext",
                    output: "or",
                    tex: null,
                    ttype: SPACE
                },
                {
                    input: "not",
                    tag: "mo",
                    output: "\u00AC",
                    tex: "neg",
                    ttype: CONST
                },
                {
                    input: "=>",
                    tag: "mo",
                    output: "\u21D2",
                    tex: "implies",
                    ttype: CONST
                },
                {
                    input: "if",
                    tag: "mo",
                    output: "if",
                    tex: null,
                    ttype: SPACE
                },
                {
                    input: "<=>",
                    tag: "mo",
                    output: "\u21D4",
                    tex: "iff",
                    ttype: CONST
                },
                {
                    input: "AA",
                    tag: "mo",
                    output: "\u2200",
                    tex: "forall",
                    ttype: CONST
                },
                {
                    input: "EE",
                    tag: "mo",
                    output: "\u2203",
                    tex: "exists",
                    ttype: CONST
                },
                {
                    input: "_|_",
                    tag: "mo",
                    output: "\u22A5",
                    tex: "bot",
                    ttype: CONST
                },
                {
                    input: "TT",
                    tag: "mo",
                    output: "\u22A4",
                    tex: "top",
                    ttype: CONST
                },
                {
                    input: "|--",
                    tag: "mo",
                    output: "\u22A2",
                    tex: "vdash",
                    ttype: CONST
                },
                {
                    input: "|==",
                    tag: "mo",
                    output: "\u22A8",
                    tex: "models",
                    ttype: CONST
                },

                //grouping brackets
                {
                    input: "(",
                    tag: "mo",
                    output: "(",
                    tex: "left(",
                    ttype: LEFTBRACKET
                },
                {
                    input: ")",
                    tag: "mo",
                    output: ")",
                    tex: "right)",
                    ttype: RIGHTBRACKET
                },
                {
                    input: "[",
                    tag: "mo",
                    output: "[",
                    tex: "left[",
                    ttype: LEFTBRACKET
                },
                {
                    input: "]",
                    tag: "mo",
                    output: "]",
                    tex: "right]",
                    ttype: RIGHTBRACKET
                },
                {
                    input: "{",
                    tag: "mo",
                    output: "{",
                    tex: null,
                    ttype: LEFTBRACKET
                },
                {
                    input: "}",
                    tag: "mo",
                    output: "}",
                    tex: null,
                    ttype: RIGHTBRACKET
                },
                {
                    input: "|",
                    tag: "mo",
                    output: "|",
                    tex: null,
                    ttype: LEFTRIGHT
                },
                {
                    input: ":|:",
                    tag: "mo",
                    output: "|",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "|:",
                    tag: "mo",
                    output: "|",
                    tex: null,
                    ttype: LEFTBRACKET
                },
                {
                    input: ":|",
                    tag: "mo",
                    output: "|",
                    tex: null,
                    ttype: RIGHTBRACKET
                },
                //{input:"||", tag:"mo", output:"||", tex:null, ttype:LEFTRIGHT},
                {
                    input: "(:",
                    tag: "mo",
                    output: "\u2329",
                    tex: "langle",
                    ttype: LEFTBRACKET
                },
                {
                    input: ":)",
                    tag: "mo",
                    output: "\u232A",
                    tex: "rangle",
                    ttype: RIGHTBRACKET
                },
                {
                    input: "<<",
                    tag: "mo",
                    output: "\u2329",
                    tex: null,
                    ttype: LEFTBRACKET
                },
                {
                    input: ">>",
                    tag: "mo",
                    output: "\u232A",
                    tex: null,
                    ttype: RIGHTBRACKET
                },
                {
                    input: "{:",
                    tag: "mo",
                    output: "{:",
                    tex: null,
                    ttype: LEFTBRACKET,
                    invisible: true
                },
                {
                    input: ":}",
                    tag: "mo",
                    output: ":}",
                    tex: null,
                    ttype: RIGHTBRACKET,
                    invisible: true
                },

                //miscellaneous symbols
                {
                    input: "int",
                    tag: "mo",
                    output: "\u222B",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "dx",
                    tag: "mi",
                    output: "{:d x:}",
                    tex: null,
                    ttype: DEFINITION
                },
                {
                    input: "dy",
                    tag: "mi",
                    output: "{:d y:}",
                    tex: null,
                    ttype: DEFINITION
                },
                {
                    input: "dz",
                    tag: "mi",
                    output: "{:d z:}",
                    tex: null,
                    ttype: DEFINITION
                },
                {
                    input: "dt",
                    tag: "mi",
                    output: "{:d t:}",
                    tex: null,
                    ttype: DEFINITION
                },
                {
                    input: "oint",
                    tag: "mo",
                    output: "\u222E",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "del",
                    tag: "mo",
                    output: "\u2202",
                    tex: "partial",
                    ttype: CONST
                },
                {
                    input: "grad",
                    tag: "mo",
                    output: "\u2207",
                    tex: "nabla",
                    ttype: CONST
                },
                {
                    input: "+-",
                    tag: "mo",
                    output: "\u00B1",
                    tex: "pm",
                    ttype: CONST
                },
                {
                    input: "O/",
                    tag: "mo",
                    output: "\u2205",
                    tex: "emptyset",
                    ttype: CONST
                },
                {
                    input: "oo",
                    tag: "mo",
                    output: "\u221E",
                    tex: "infty",
                    ttype: CONST
                },
                {
                    input: "aleph",
                    tag: "mo",
                    output: "\u2135",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "...",
                    tag: "mo",
                    output: "...",
                    tex: "ldots",
                    ttype: CONST
                },
                {
                    input: ":.",
                    tag: "mo",
                    output: "\u2234",
                    tex: "therefore",
                    ttype: CONST
                },
                {
                    input: ":'",
                    tag: "mo",
                    output: "\u2235",
                    tex: "because",
                    ttype: CONST
                },
                {
                    input: "/_",
                    tag: "mo",
                    output: "\u2220",
                    tex: "angle",
                    ttype: CONST
                },
                {
                    input: "/_\\",
                    tag: "mo",
                    output: "\u25B3",
                    tex: "triangle",
                    ttype: CONST
                },
                {
                    input: "'",
                    tag: "mo",
                    output: "\u2032",
                    tex: "prime",
                    ttype: CONST
                },
                {
                    input: "tilde",
                    tag: "mover",
                    output: "~",
                    tex: null,
                    ttype: UNARY,
                    acc: true
                },
                {
                    input: "\\ ",
                    tag: "mo",
                    output: "\u00A0",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "frown",
                    tag: "mo",
                    output: "\u2322",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "quad",
                    tag: "mo",
                    output: "\u00A0\u00A0",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "qquad",
                    tag: "mo",
                    output: "\u00A0\u00A0\u00A0\u00A0",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "cdots",
                    tag: "mo",
                    output: "\u22EF",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "vdots",
                    tag: "mo",
                    output: "\u22EE",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "ddots",
                    tag: "mo",
                    output: "\u22F1",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "diamond",
                    tag: "mo",
                    output: "\u22C4",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "square",
                    tag: "mo",
                    output: "\u25A1",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "|__",
                    tag: "mo",
                    output: "\u230A",
                    tex: "lfloor",
                    ttype: CONST
                },
                {
                    input: "__|",
                    tag: "mo",
                    output: "\u230B",
                    tex: "rfloor",
                    ttype: CONST
                },
                {
                    input: "|~",
                    tag: "mo",
                    output: "\u2308",
                    tex: "lceiling",
                    ttype: CONST
                },
                {
                    input: "~|",
                    tag: "mo",
                    output: "\u2309",
                    tex: "rceiling",
                    ttype: CONST
                },
                {
                    input: "CC",
                    tag: "mo",
                    output: "\u2102",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "NN",
                    tag: "mo",
                    output: "\u2115",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "QQ",
                    tag: "mo",
                    output: "\u211A",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "RR",
                    tag: "mo",
                    output: "\u211D",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "ZZ",
                    tag: "mo",
                    output: "\u2124",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "f",
                    tag: "mi",
                    output: "f",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "g",
                    tag: "mi",
                    output: "g",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },

                //standard functions
                {
                    input: "lim",
                    tag: "mo",
                    output: "lim",
                    tex: null,
                    ttype: UNDEROVER
                },
                {
                    input: "Lim",
                    tag: "mo",
                    output: "Lim",
                    tex: null,
                    ttype: UNDEROVER
                },
                {
                    input: "sin",
                    tag: "mo",
                    output: "sin",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "cos",
                    tag: "mo",
                    output: "cos",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "tan",
                    tag: "mo",
                    output: "tan",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "sinh",
                    tag: "mo",
                    output: "sinh",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "cosh",
                    tag: "mo",
                    output: "cosh",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "tanh",
                    tag: "mo",
                    output: "tanh",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "cot",
                    tag: "mo",
                    output: "cot",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "sec",
                    tag: "mo",
                    output: "sec",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "csc",
                    tag: "mo",
                    output: "csc",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "arcsin",
                    tag: "mo",
                    output: "arcsin",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "arccos",
                    tag: "mo",
                    output: "arccos",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "arctan",
                    tag: "mo",
                    output: "arctan",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "coth",
                    tag: "mo",
                    output: "coth",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "sech",
                    tag: "mo",
                    output: "sech",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "csch",
                    tag: "mo",
                    output: "csch",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "exp",
                    tag: "mo",
                    output: "exp",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "abs",
                    tag: "mo",
                    output: "abs",
                    tex: null,
                    ttype: UNARY,
                    rewriteleftright: ["|", "|"]
                },
                {
                    input: "norm",
                    tag: "mo",
                    output: "norm",
                    tex: null,
                    ttype: UNARY,
                    rewriteleftright: ["\u2225", "\u2225"]
                },
                {
                    input: "floor",
                    tag: "mo",
                    output: "floor",
                    tex: null,
                    ttype: UNARY,
                    rewriteleftright: ["\u230A", "\u230B"]
                },
                {
                    input: "ceil",
                    tag: "mo",
                    output: "ceil",
                    tex: null,
                    ttype: UNARY,
                    rewriteleftright: ["\u2308", "\u2309"]
                },
                {
                    input: "log",
                    tag: "mo",
                    output: "log",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "ln",
                    tag: "mo",
                    output: "ln",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "det",
                    tag: "mo",
                    output: "det",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "dim",
                    tag: "mo",
                    output: "dim",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "mod",
                    tag: "mo",
                    output: "mod",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "gcd",
                    tag: "mo",
                    output: "gcd",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "lcm",
                    tag: "mo",
                    output: "lcm",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "lub",
                    tag: "mo",
                    output: "lub",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "glb",
                    tag: "mo",
                    output: "glb",
                    tex: null,
                    ttype: CONST
                },
                {
                    input: "min",
                    tag: "mo",
                    output: "min",
                    tex: null,
                    ttype: UNDEROVER
                },
                {
                    input: "max",
                    tag: "mo",
                    output: "max",
                    tex: null,
                    ttype: UNDEROVER
                },
                {
                    input: "Sin",
                    tag: "mo",
                    output: "Sin",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Cos",
                    tag: "mo",
                    output: "Cos",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Tan",
                    tag: "mo",
                    output: "Tan",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Arcsin",
                    tag: "mo",
                    output: "Arcsin",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Arccos",
                    tag: "mo",
                    output: "Arccos",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Arctan",
                    tag: "mo",
                    output: "Arctan",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Sinh",
                    tag: "mo",
                    output: "Sinh",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Cosh",
                    tag: "mo",
                    output: "Cosh",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Tanh",
                    tag: "mo",
                    output: "Tanh",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Cot",
                    tag: "mo",
                    output: "Cot",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Sec",
                    tag: "mo",
                    output: "Sec",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Csc",
                    tag: "mo",
                    output: "Csc",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Log",
                    tag: "mo",
                    output: "Log",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Ln",
                    tag: "mo",
                    output: "Ln",
                    tex: null,
                    ttype: UNARY,
                    func: true
                },
                {
                    input: "Abs",
                    tag: "mo",
                    output: "abs",
                    tex: null,
                    ttype: UNARY,
                    notexcopy: true,
                    rewriteleftright: ["|", "|"]
                },

                //arrows
                {
                    input: "uarr",
                    tag: "mo",
                    output: "\u2191",
                    tex: "uparrow",
                    ttype: CONST
                },
                {
                    input: "darr",
                    tag: "mo",
                    output: "\u2193",
                    tex: "downarrow",
                    ttype: CONST
                },
                {
                    input: "rarr",
                    tag: "mo",
                    output: "\u2192",
                    tex: "rightarrow",
                    ttype: CONST
                },
                {
                    input: "->",
                    tag: "mo",
                    output: "\u2192",
                    tex: "to",
                    ttype: CONST
                },
                {
                    input: ">->",
                    tag: "mo",
                    output: "\u21A3",
                    tex: "rightarrowtail",
                    ttype: CONST
                },
                {
                    input: "->>",
                    tag: "mo",
                    output: "\u21A0",
                    tex: "twoheadrightarrow",
                    ttype: CONST
                },
                {
                    input: ">->>",
                    tag: "mo",
                    output: "\u2916",
                    tex: "twoheadrightarrowtail",
                    ttype: CONST
                },
                {
                    input: "|->",
                    tag: "mo",
                    output: "\u21A6",
                    tex: "mapsto",
                    ttype: CONST
                },
                {
                    input: "larr",
                    tag: "mo",
                    output: "\u2190",
                    tex: "leftarrow",
                    ttype: CONST
                },
                {
                    input: "harr",
                    tag: "mo",
                    output: "\u2194",
                    tex: "leftrightarrow",
                    ttype: CONST
                },
                {
                    input: "rArr",
                    tag: "mo",
                    output: "\u21D2",
                    tex: "Rightarrow",
                    ttype: CONST
                },
                {
                    input: "lArr",
                    tag: "mo",
                    output: "\u21D0",
                    tex: "Leftarrow",
                    ttype: CONST
                },
                {
                    input: "hArr",
                    tag: "mo",
                    output: "\u21D4",
                    tex: "Leftrightarrow",
                    ttype: CONST
                },
                //commands with argument
                {
                    input: "sqrt",
                    tag: "msqrt",
                    output: "sqrt",
                    tex: null,
                    ttype: UNARY
                },
                {
                    input: "root",
                    tag: "mroot",
                    output: "root",
                    tex: null,
                    ttype: BINARY
                },
                {
                    input: "frac",
                    tag: "mfrac",
                    output: "/",
                    tex: null,
                    ttype: BINARY
                },
                {
                    input: "/",
                    tag: "mfrac",
                    output: "/",
                    tex: null,
                    ttype: INFIX
                },
                {
                    input: "stackrel",
                    tag: "mover",
                    output: "stackrel",
                    tex: null,
                    ttype: BINARY
                },
                {
                    input: "overset",
                    tag: "mover",
                    output: "stackrel",
                    tex: null,
                    ttype: BINARY
                },
                {
                    input: "underset",
                    tag: "munder",
                    output: "stackrel",
                    tex: null,
                    ttype: BINARY
                },
                {
                    input: "_",
                    tag: "msub",
                    output: "_",
                    tex: null,
                    ttype: INFIX
                },
                {
                    input: "^",
                    tag: "msup",
                    output: "^",
                    tex: null,
                    ttype: INFIX
                },
                {
                    input: "hat",
                    tag: "mover",
                    output: "\u005E",
                    tex: null,
                    ttype: UNARY,
                    acc: true
                },
                {
                    input: "bar",
                    tag: "mover",
                    output: "\u00AF",
                    tex: "overline",
                    ttype: UNARY,
                    acc: true
                },
                {
                    input: "vec",
                    tag: "mover",
                    output: "\u2192",
                    tex: null,
                    ttype: UNARY,
                    acc: true
                },
                {
                    input: "dot",
                    tag: "mover",
                    output: ".",
                    tex: null,
                    ttype: UNARY,
                    acc: true
                },
                {
                    input: "ddot",
                    tag: "mover",
                    output: "..",
                    tex: null,
                    ttype: UNARY,
                    acc: true
                },
                {
                    input: "overarc",
                    tag: "mover",
                    output: "\u23DC",
                    tex: "overparen",
                    ttype: UNARY,
                    acc: true
                },
                {
                    input: "ul",
                    tag: "munder",
                    output: "\u0332",
                    tex: "underline",
                    ttype: UNARY,
                    acc: true
                },
                {
                    input: "ubrace",
                    tag: "munder",
                    output: "\u23DF",
                    tex: "underbrace",
                    ttype: UNARYUNDEROVER,
                    acc: true
                },
                {
                    input: "obrace",
                    tag: "mover",
                    output: "\u23DE",
                    tex: "overbrace",
                    ttype: UNARYUNDEROVER,
                    acc: true
                },
                {
                    input: "text",
                    tag: "mtext",
                    output: "text",
                    tex: null,
                    ttype: TEXT
                },
                {
                    input: "mbox",
                    tag: "mtext",
                    output: "mbox",
                    tex: null,
                    ttype: TEXT
                },
                {
                    input: "color",
                    tag: "mstyle",
                    ttype: BINARY
                },
                {
                    input: "id",
                    tag: "mrow",
                    ttype: BINARY
                },
                {
                    input: "class",
                    tag: "mrow",
                    ttype: BINARY
                },
                {
                    input: "cancel",
                    tag: "menclose",
                    output: "cancel",
                    tex: null,
                    ttype: UNARY
                },
                quote,
                {
                    input: "bb",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "bold",
                    output: "bb",
                    tex: null,
                    ttype: UNARY
                },
                {
                    input: "mathbf",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "bold",
                    output: "mathbf",
                    tex: null,
                    ttype: UNARY
                },
                {
                    input: "sf",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "sans-serif",
                    output: "sf",
                    tex: null,
                    ttype: UNARY
                },
                {
                    input: "mathsf",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "sans-serif",
                    output: "mathsf",
                    tex: null,
                    ttype: UNARY
                },
                {
                    input: "bbb",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "double-struck",
                    output: "bbb",
                    tex: null,
                    ttype: UNARY,
                    codes: AMbbb
                },
                {
                    input: "mathbb",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "double-struck",
                    output: "mathbb",
                    tex: null,
                    ttype: UNARY,
                    codes: AMbbb
                },
                {
                    input: "cc",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "script",
                    output: "cc",
                    tex: null,
                    ttype: UNARY,
                    codes: AMcal
                },
                {
                    input: "mathcal",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "script",
                    output: "mathcal",
                    tex: null,
                    ttype: UNARY,
                    codes: AMcal
                },
                {
                    input: "tt",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "monospace",
                    output: "tt",
                    tex: null,
                    ttype: UNARY
                },
                {
                    input: "mathtt",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "monospace",
                    output: "mathtt",
                    tex: null,
                    ttype: UNARY
                },
                {
                    input: "fr",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "fraktur",
                    output: "fr",
                    tex: null,
                    ttype: UNARY,
                    codes: AMfrk
                },
                {
                    input: "mathfrak",
                    tag: "mstyle",
                    atname: "mathvariant",
                    atval: "fraktur",
                    output: "mathfrak",
                    tex: null,
                    ttype: UNARY,
                    codes: AMfrk
                }
            ];
            var names = [];

            function compareNames(s1, s2) {
                return s1.input > s2.input ? 1 : -1;
            }

            var nestingDepth, previousSymbol, currentSymbol;
            var decimalsign = ".";
        }

        function removeCharsAndBlanks(str, n) {
            var st;
            if (str.charAt(n) == "\\" && str.charAt(n + 1) != "\\" && str.charAt(n + 1) != " ")
                st = str.slice(n + 1);
            else st = str.slice(n);
            for (var i = 0; i < st.length && st.charCodeAt(i) <= 32; i = i + 1);
            return st.slice(i);
        }

        function position(arr, str, n) {
            if (n == 0) {
                var h, m;
                n = -1;
                h = arr.length;
                while (n + 1 < h) {
                    m = (n + h) >> 1;
                    if (arr[m] < str) n = m;
                    else h = m;
                }
                return h;
            } else {
                for (var i = n; i < arr.length && arr[i] < str; i++);
                return i;
            }
        }

        function getSymbol(str) {
            var i, j, k;
            var mk, st, tagst, match, more;
            var integ = true;
            j = 0;
            k = 0;
            match = "";
            more = true;
            for (i = 1; i <= str.length && more; i++) {
                st = str.slice(0, i);
                j = k;
                k = position(names, st, j);
                if (k < names.length && str.slice(0, names[k].length) == names[k]) {
                    match = names[k];
                    mk = k;
                    i = match.length;
                }
                more = k < names.length && str.slice(0, names[k].length) >= names[k];
            }
            previousSymbol = currentSymbol;
            if (match != "") {
                currentSymbol = symbols[mk].ttype;
                return symbols[mk];
            }
            currentSymbol = CONST;
            k = 1;
            st = str.slice(0, 1);

            while ("0" <= st && st <= "9" && k <= str.length) {
                st = str.slice(k, k + 1);
                k++;
            }
            if (st == decimalsign) {
                st = str.slice(k, k + 1);
                if ("0" <= st && st <= "9") {
                    integ = false;
                    k++;
                    while ("0" <= st && st <= "9" && k <= str.length) {
                        st = str.slice(k, k + 1);
                        k++;
                    }
                }
            }
            if ((integ && k > 1) || k > 2) {
                st = str.slice(0, k - 1);
                tagst = "mn";
            } else {
                k = 2;
                st = str.slice(0, 1); //take 1 character
                tagst = (("A" > st || st > "Z") && ("a" > st || st > "z") ? "mo" : "mi");
            }
            if (st == "-" && previousSymbol == INFIX) {
                currentSymbol = INFIX;
                return {
                    input: st,
                    tag: tagst,
                    output: st,
                    ttype: UNARY,
                    func: true
                };
            }
            return {
                input: st,
                tag: tagst,
                output: st,
                ttype: CONST
            };
        }

        function removeBrackets(node) {
            var temp;
            if (node.children.length === 0) {
                return;
            }
            if (node.tag === "mrow" || node.tag === "M:MROW") {
                if (node.children[0].children.length !== 0) {
                    temp = node.children[0].children[0].text;
                    if (temp === "(" || temp === "[" || temp === "{")
                        node.children.shift();
                }
                if (myLast(node.children).children.length !== 0) {
                    temp = myLast(node.children).children[0].text;
                    if (temp === ")" || temp === "]" || temp === "}")
                        node.children.pop();
                }
            }
        }

        function appendChild(node, add) {
            if (add) {
                if (add.tag !== 'frag')
                    node.children.push(add);
                else {
                    for (var i in add.children) {
                        appendChild(node, add.children[i]);
                    }
                }
            }
        }

        function parseSexpr(str) {
            var symbol, node, res1, res2, st;
            var i, j;
            var frag = createMathNode("", "frag");

            str = removeCharsAndBlanks(str, 0);
            symbol = getSymbol(str);
            if (symbol === null || symbol.ttype === RIGHTBRACKET && nestingDepth > 0) {
                return [null, str];
            }
            if (symbol.ttype === DEFINITION) {
                str = symbol.output + removeCharsAndBlanks(str, symbol.input.length);
                symbol = getSymbol(str);
            }
            switch (symbol.ttype) {
                case UNDEROVER:
                case CONST:
                    str = removeCharsAndBlanks(str, symbol.input.length);
                    return [createMathNode("", symbol.tag, createMathNode(symbol.output, "notag")), str];

                case LEFTBRACKET:
                    nestingDepth++;
                    str = removeCharsAndBlanks(str, symbol.input.length);
                    res1 = parseExpr(str, true);
                    nestingDepth--;
                    if (typeof symbol.invisible === "boolean" && symbol.invisible)
                        node = createMathNode("", "mrow", res1[0]);
                    else {
                        node = createMathNode("", "mo", createMathNode(symbol.output, "notag"));
                        node = createMathNode("", "mrow", node);
                        appendChild(node, res1[0]);
                    }
                    return [node, res1[1]];

                case TEXT:
                    if (symbol !== quote)
                        str = removeCharsAndBlanks(str, symbol.input.length)
                    if (str.charAt(0) === "{") i = str.indexOf("}");
                    else if (str.charAt(0) === "(") i = str.indexOf(")");
                    else if (str.charAt(0) === "[") i = str.indexOf("]");
                    else if (symbol == quote) i = str.slice(1).indexOf("\"") + 1;
                    else i = 0;
                    if (i === -1)
                        i = str.length;
                    st = str.slice(1, i);
                    if (st.charAt(0) === " ") {
                        node = createMathNode("", "mspace");
                        node.attribute.width = "1ex";
                        appendChild(frag, node);
                    }
                    appendChild(frag, createMathNode("", symbol.tag, createMathNode(st, "notag")));
                    if (st.charAt(st.length - 1) === " ") {
                        node = createMathNode("", "mspace");
                        node.attribute.width = "1ex";
                        appendChild(frag, node);
                    }
                    str = removeCharsAndBlanks(str, i + 1);
                    return [createMathNode("", "mrow", frag), str];

                case UNARYUNDEROVER:
                case UNARY:
                    str = removeCharsAndBlanks(str, symbol.input.length);
                    res1 = parseSexpr(str);
                    if (res1[0] === null)
                        return [createMathNode("", symbol.tag, createMathNode(symbol.output, "notag")), str];
                    if (typeof symbol.func === "boolean" && symbol.func) {
                        st = str.charAt(0);
                        if (st === "^" || st === "_" || st === "/" || st === "|" || st === "," || (symbol.input.length === 1 && symbol.input.match(/\w/) && st !== "(")) {
                            return [createMathNode("", symbol.tag, createMathNode(symbol.output, "notag")), str];
                        } else {
                            node = createMathNode("", "mrow", createMathNode("", symbol.tag, createMathNode(symbol.output, "notag")));
                            appendChild(node, res1[0]);
                            return [node, res1[1]];
                        }
                    }
                    removeBrackets(res1[0]);
                    if (symbol.input === "sqrt") {
                        return [createMathNode("", symbol.tag, res1[0]), res1[1]];
                    } else if (typeof symbol.rewriteleftright !== "undefined") {
                        node = createMathNode("", "mrow", createMathNode("", "mo", createMathNode(symbol.rewriteleftright[0], "notag")));
                        appendChild(node, res1[0]);
                        appendChild(node, createMathNode("", "mo", createMathNode(symbol.rewriteleftright[1], "notag")));
                        return [node, res1[1]];
                    } else if (symbol.input === "cancel") {
                        node = createMathNode("", symbol.tag, res1[0]);
                        node.attribute.notation = "updiagonalstrike";
                        return [node, res1[1]];
                    } else if (typeof symbol.acc === "boolean" && symbol.acc) {
                        node = createMathNode("", symbol.tag, res1[0]);
                        var accnode = createMathNode("", "mo", createMathNode(symbol.output, "notag"));
                        if (symbol.input === "vec" && ((res1[0].type === "mrow" && res1[0].children.length === 1 && res1[0].children[0].children[0].text !== "" && res1[0].children[0].children[0].text.length === 1) || (res1[0].children[0].text.length === 1))) {
                            accnode.attribute.stretchy = false;
                        }
                        appendChild(node, accnode);
                        return [node, res1[1]];
                    } else {
                        if (typeof symbol.codes !== "undefined") {
                            for (i = 0; i < res1[0].children.length; i++) {
                                if (res1[0].children[i].tag === "mi" || res1[0].type === "mi") {
                                    st = (res1[0].tag === "mi" ? res1[0].children[0].text : res1[0].children[i].children[0].text);
                                    var newst = [];
                                    for (j = 0; j < st.length; j++) {
                                        if (st.charCodeAt(j) > 64 && st.charCodeAt(j) < 91)
                                            newst = newst.symbol.codes[st.charCodeAt(j) - 65];
                                        else if (st.charCodeAt(j) > 96 && st.charCodeAt(j) < 123)
                                            newst = newst + symbol.codes[st.charCodeAt(j) - 71];
                                        else
                                            newst = newst + st.charAt(j);
                                    }
                                    if (res1[0].tag === "mi") {
                                        res1[0] = createMathNode("", "mo", createMathNode(newst, "notag"));
                                    } else {
                                        res1[0].splice(i, 1, createMathNode("", "mo", createMathNode(newst, "notag")));
                                    }
                                }
                            }
                        }
                        node = createMathNode("", symbol.tag, res1[0]);
                        node.attribute[symbol.atname] = symbol.atval;
                        return [node, res1[1]];
                    }

                case BINARY:
                    str = removeCharsAndBlanks(str, symbol.input.length);
                    res1 = parseSexpr(str);
                    if (res1[0] === null)
                        return [createMathNode("", "mo", createMathNode(symbol.input, "notag")), str];
                    removeBrackets(res1[0]);
                    res2 = parseSexpr(res1[1]);
                    if (res2[0] === null)
                        return [createMathNode("", "mo", createMathNode(symbol.input, "notag")), str];
                    removeBrackets(res2[0]);
                    if (['color', 'class', 'id'].indexOf(symbol.input) >= 0) {
                        if (str.charAt(0) === "{") i = str.indexOf("}");
                        else if (str.charAt(0) === "(") i = str.indexOf(")");
                        else if (str.charAt(0) === "[") i = str.indexOf("]");
                        st = str.slice(1, i);

                        node = createMathNode("", symbol.tag, res2[0]);

                        if (symbol.input === "color") node.attribute.mathcolor = st;
                        else if (symbol.input === "class") node.attribute.class = st;
                        else if (symbol.input === "id") node.attribute.id = st;
                        return [node, res2[1]];
                    }
                    if (symbol.input === "root" || symbol.output === "stackrel")
                        appendChild(frag, res2[0]);
                    appendChild(frag, res1[0]);
                    if (symbol.input === "frac")
                        appendChild(frag, res2[0]);
                    return [createMathNode("", symbol.tag, frag), res2[1]];

                case INFIX:
                    str = removeCharsAndBlanks(str, symbol.input.length);
                    return [createMathNode("", "mo", createMathNode(symbol.output, "notag")), str];

                case SPACE:
                    str = removeCharsAndBlanks(str, symbol.input.length);
                    node = createMathNode("", "mspace");
                    node.attribute.width = "1ex";
                    appendChild(frag, node);
                    appendChild(frag, createMathNode("", symbol.tag, createMathNode(symbol.output, "notag")));
                    node = createMathNode("", "mspace");
                    node.attribute.width = "1ex";
                    appendChild(frag, node);
                    return [createMathNode("", "mrow", frag), str];

                case LEFTRIGHT:
                    nestingDepth++;
                    str = removeCharsAndBlanks(str, symbol.input.length);
                    res1 = parseExpr(str, false);
                    nestingDepth--;
                    st = "";
                    var temp = res1[0].children.length;
                    if (temp > 0)
                        st = res1[0].children[temp - 1].children[0].text;
                    if (st === "|" && str.charAt(0) !== ",") {
                        node = createMathNode("", "mo", createMathNode(symbol.output, "notag"));
                        node = createMathNode("", "mrow", node);
                        appendChild(node, res1[0]);
                        return [node, res1[1]];
                    } else {
                        node = createMathNode("", "mo", createMathNode("\u2223", "notag"));
                        node = createMathNode("", "mrow", node);
                        return [node, str];
                    }

                default:
                    str = removeCharsAndBlanks(str, symbol.input.length);
                    return [createMathNode("", symbol.tag, createMathNode(symbol.output, "notag")), str];
            }
        }

        function parseIexpr(str) {
            var symbol;
            var sym1, sym2;
            var node;
            var res1, res2;
            var underover;

            str = removeCharsAndBlanks(str, 0);
            sym1 = getSymbol(str);
            res1 = parseSexpr(str);
            node = res1[0];
            str = res1[1];
            symbol = getSymbol(str);
            if (symbol.ttype === INFIX && symbol.input !== "/") {
                str = removeCharsAndBlanks(str, symbol.input.length);
                res1 = parseSexpr(str);
                if (res1[0] == null) {
                    var box = createMathNode("\u25A1", "notag");
                    res1[0] = createMathNode("", "mo", box);
                } else
                    removeBrackets(res1[0]);
                str = res1[1];
                underover = (sym1.ttype === UNDEROVER || sym1.ttype === UNARYUNDEROVER);
                if (symbol.input === "_") {
                    sym2 = getSymbol(str);
                    if (sym2.input === "^") {
                        str = removeCharsAndBlanks(str, sym2.input.length);
                        res2 = parseSexpr(str);
                        removeBrackets(res2[0]);
                        str = res2[1];
                        node = createMathNode("", (underover ? "munderover" : "msubsup"), node);
                        appendChild(node, res1[0]);
                        appendChild(node, res2[0]);
                        node = createMathNode("", "mrow", node);
                    } else {
                        node = createMathNode("", (underover ? "munder" : "msub"), node);
                        appendChild(node, res1[0]);
                    }
                } else if (symbol.input === "^" && underover) {
                    node = createMathNode("", "mover", node);
                    appendChild(node, res1[0]);
                } else {
                    node = createMathNode("", symbol.tag, node);
                    appendChild(node, res1[0]);
                }
                if (typeof sym1.func !== "undefined" && sym1.func) {
                    sym2 = getSymbol(str);
                    if (sym2.ttype !== INFIX && sym2.ttype !== RIGHTBRACKET && (sym1.input.length > 1 || sym2.ttype === LEFTBRACKET)) {
                        res1 = parseIexpr(str);
                        node = createMathNode("", "mrow", node);
                        appendChild(node, res1[0]);
                        str = res1[1];
                    }
                }
            }

            return [node, str];
        }

        function parseExpr(str, rightbracket) {
            var symbol, node, result, i, j;
            var frag = createMathNode("", "frag");
            do {
                str = removeCharsAndBlanks(str, 0);
                result = parseIexpr(str);
                node = result[0];
                str = result[1];
                symbol = getSymbol(str);
                if (symbol.ttype === INFIX && symbol.input === "/") {
                    str = removeCharsAndBlanks(str, symbol.input.length);
                    result = parseIexpr(str);
                    if (result[0] === null)
                        result[0] = createMathNode("\u25A1", "mo");
                    else
                        removeBrackets(result[0]);
                    str = result[1];
                    removeBrackets(node);
                    node = createMathNode("", symbol.tag, node);
                    appendChild(node, result[0]);
                    appendChild(frag, node);
                    symbol = getSymbol(str);
                } else if (node !== undefined)
                    appendChild(frag, node);
            } while ((symbol.ttype !== RIGHTBRACKET && (symbol.ttype !== LEFTRIGHT || rightbracket) || nestingDepth === 0) && symbol !== null && symbol.output !== "");
            if (symbol.ttype === RIGHTBRACKET || symbol.ttype === LEFTRIGHT) {
                var len = frag.children.length;
                if (len > 0 && myLast(frag.children).tag === "mrow" &&
                    frag.children[len - 1].children.length >= 1 &&
                    myLast(frag.children[len - 1].children).children.length >= 1) {
                    var right = myLast(myLast(frag.children).children).children[0].text;
                    if(right === ")" || right === "]"){
                        var left = myLast(frag.children).children[0].children[0].text;
                        if((left==="("&&right===")")||(left==="["&&right==="]")){
                            var pos = [];
                            var matrix = true;
                            for(i = 0;matrix&&i<len;i=i+2){
                                pos[i] = [];
                                node = frag.children[i];
                                if(matrix)
                                    matrix = (node.tag === "mrow") &&
                                    (i===len-1 || frag.children[i+1].tag === "mo" && frag.children[i+1].children[0].text === ",") &&
                                    node.children[0].children[0].text === left &&
                                    myLast(node.children).children[0].text === right;
                                if(matrix)
                                    for(j = 0;j<node.children.length;j++){
                                        if(node.children[j].children[0].text === ",")
                                            pos[i].push(j);
                                    }
                                if(matrix && i>1){
                                    matrix = pos[i].length === pos[i-2].length;
                                }
                            }
                            matrix = matrix &&(pos.length>1||pos[0].length>0);
                            var columnlines = [];
                            if(matrix){
                                var row, nfrag,n,k,table;
                                table = createMathNode("","frag");
                                for(i=0;i<len;i=i+2){
                                    row = createMathNode("","frag");
                                    nfrag = createMathNode("","frag");
                                    node = frag.children[0];
                                    n = node.children.length;
                                    k = 0;
                                    node.children.shift();
                                    for(j = 1;j<n-1;j++){
                                        if(typeof pos[i][k]!=="undefined" && j===pos[i][k]){
                                            node.children.shift();
                                            if(node.children[0].tag === "mrow" && 
                                            node.children[0].children.length === 1 && 
                                            node.children[0].children[0].children[0].text === "\u2223"){
                                                if(i === 0){
                                                    columnlines.push("solid");
                                                }
                                                node.children.shift();
                                                node.children.shift();
                                                j+=2;
                                                k++; 
                                            }else if(i === 0){
                                                columnlines.push("none");
                                            }
                                            appendChild(row,createMathNode("","mtd",nfrag));
                                            nfrag = createMathNode("","frag");
                                            k++;
                                        }else{
                                            appendChild(nfrag,node.children[0]);
                                            node.children.shift();
                                        }
                                    }
                                    appendChild(row,createMathNode("","mtd",nfrag));
                                    if(i===0){
                                        columnlines.push("none");
                                    }
                                    if(frag.children.length>2){
                                        frag.children.shift();
                                        frag.children.shift();
                                    }
                                    appendChild(table,createMathNode("","mtr",row));
                                }
                                node = createMathNode("","mtable",table);
                                node.attribute.columnlines = columnlines.join(" ");
                                if(typeof symbol.invisible === "boolean" && symbol.invisible === true)
                                    node.attribute.columnalign = left;
                                frag.children.shift();
                                frag.children.unshift(node);    
                            }
                        }
                    }
                }

                str = removeCharsAndBlanks(str, symbol.input.length);
                if (typeof symbol.invisible !== "boolean" || !symbol.invisible) {
                    var notag = createMathNode(symbol.output, "notag");
                    node = createMathNode("", "mo", notag);
                    appendChild(frag, node);
                }
            }
            return [frag, str];
        }
    }

    function handleUML(node) {
        if (UML === null) {
            UML = new Uml();
            UML.init();
        }
        node.output = UML.handle(node.text);
    }

    function Uml() {
        var graph;
        var configChange;
        var config;
        var styles;
        var visualizers;
        var svg;
        var vector;

        this.init = function () {
            initialStyle();
            initialVisualizer();
            svg = new SVG();
            vector = new Vector();
        }

        this.handle = function (text) {
            svg = new SVG();
            vector = new Vector();
            configChange = {};
            convertToGraph(text);
            config = getConfig(configChange);

            calculateLayout();
            render();
            return svg.output();
        }

        // functions
        {
            function convertToGraph(text) {
                var relationid = 0;
                var labelid = 0;
                var stack = [];
                var curcomp = new Compartment();
                stack.push(curcomp);
                var lines = text.split('\n');
                var rel = null;
                var typers = {
                    'blank': (s) => {
                        return /^[ ]+$/.test(s);
                    },
                    'classDef': (s) => {
                        return /.+(class|abstract|instance|reference).+{$/.test(s);
                    },
                    'classRel': (s) => {
                        return /(aggregate|composite|extend)/.test(s);
                    },
                    'packageStart': (s) => {
                        return /.+(package|frame|database|state).+{$/.test(s);
                    },
                    'packageEnd': (s) => {
                        return /^[ ]*}[ ]*$/.test(s);
                    },
                    'interDef': (s) => {
                        return /(interact{)/.test(s);
                    },
                    'configChange': (s) => {
                        return /^#\w+:\w+$/.test(s);
                    },
                    'basicRel': (s) => {
                        if (rel === null) {
                            rel = [];
                            var l = ['', '<', '<:', '+', '@'];
                            var m = ['-', '--'];
                            var r = ['', '>', ':>', '+', '@'];
                            for (var i in l) {
                                for (var j in m) {
                                    for (var k in r) {
                                        rel.push(l[i] + m[j] + r[k]);
                                    }
                                }
                            }
                        }
                        var parts = splitToParts(s);
                        if (parts.length !== 3 && parts.length !== 4)
                            return false;
                        for (var i in rel) {
                            if (s.indexOf(rel[i]) !== -1)
                                return true;
                        }
                        return false;
                    },
                    'basicDef': (s) => {
                        return /\w/.test(s);
                    },
                };
                var packageDepth = 0;

                for (var i = 0; i < lines.length; i++) {
                    var l = lines[i].trim();
                    var find = false;
                    for (var t in typers) {
                        if (typers[t](l) === true) {
                            find = true;
                            break;
                        }
                    }
                    if (find) {
                        switch (t) {
                            case 'basicDef':
                                var type, name, title, node;
                                var res = getTNT(l);
                                type = res.type;
                                name = res.name;
                                title = res.title;
                                node = new UmlNode(type, name, title);
                                if (!isNodeExist(curcomp, name)) {
                                    curcomp.nodes.push(node);
                                }
                                break;
                            case 'basicRel':
                                var assoc, name1, name2, label1, label2, message;
                                var messagename = '';
                                var res;
                                var temp;
                                var parts = splitToParts(l);

                                temp = parts[0];
                                res = getTNT(temp.trim());
                                name1 = res.name;
                                makeNodeExist(res.name, res.type, res.title);

                                temp = parts[2];
                                part = getPart(temp);
                                res = getTNT(temp.trim());
                                name2 = res.name;
                                makeNodeExist(res.name, res.type, res.title);

                                if (parts.length > 3)
                                    message = parts[3].replace(/[\[\]]/g, '');
                                else
                                    message = '';

                                if (message !== '') {
                                    messagename = '_label' + labelid;
                                    labelid = labelid + 1;
                                    makeNodeExist(messagename, 'LABEL', message);
                                }

                                assoc = parts[1].match(/\W+/)[0];
                                label1 = parts[1].split(assoc)[0];
                                label2 = parts[1].split(assoc)[1];

                                var a1, a2, a3;
                                a2 = assoc.match(/[-]+/)[0];
                                parts = assoc.split(a2);
                                a1 = parts[0];
                                a3 = parts[1];

                                if (message !== '') {
                                    var r1, r2;
                                    r1 = new Relation(a1 + a2, name1, messagename, label1, '');
                                    r2 = new Relation(a2 + a3, messagename, name2, '', label2);
                                    curcomp.relations.push(r1);
                                    curcomp.relations.push(r2);
                                } else {
                                    var r = new Relation(assoc, name1, name2, label1, label2);
                                    curcomp.relations.push(r);
                                }
                                break;
                            case 'classDef':
                                var def = '';

                                for (; i < lines.length; i++) {
                                    def = def + lines[i].trim() + ';';
                                    if (lines[i].indexOf('}') !== -1)
                                        break;
                                }

                                var type, name, title;
                                var res;
                                var node;
                                var p, f;
                                var parts;
                                var temp;
                                res = getTNT(l.replace('{', ''));
                                type = res.type;
                                name = res.name;
                                title = res.title;
                                node = new UmlNode(type, name, title);
                                if (!isNodeExist(curcomp, name)) {
                                    curcomp.nodes.push(node);
                                }
                                p = new Compartment();
                                f = new Compartment();
                                temp = def.match(/{.+}/)[0].slice(1, -1).trim();
                                parts = temp.split(';');
                                for (var index in parts) {
                                    if (parts[index] !== '') {
                                        if (parts[index].indexOf('(') !== -1)
                                            f.lines.push(parts[index]);
                                        else
                                            p.lines.push(parts[index]);
                                    }
                                }
                                if (p.lines.length > 0) {
                                    node.compartments.push(p);
                                }
                                if (f.lines.length > 0) {
                                    node.compartments.push(f);
                                }

                                break;
                            case 'classRel':
                                lines[i] = lines[i].replace('aggregate', '-@').replace('composite', '-+').replace('extend', '-:>');
                                i = i - 1;
                                break;
                            case 'packageStart':
                                packageDepth = packageDepth + 1;
                                var type, name, title;
                                var res = getTNT(l.replace('{', ''));
                                type = res.type;
                                name = res.name;
                                title = res.title;
                                var node = new UmlNode(type, name, title);
                                curcomp.nodes.push(node);
                                var c = new Compartment();
                                node.compartments.push(c);
                                curcomp = c;
                                stack.push(c);
                                break;
                            case 'packageEnd':
                                packageDepth = packageDepth - 1;
                                if (stack.length > 1) {
                                    stack.pop();
                                    curcomp = stack[stack.length - 1];
                                }
                                break;
                            case 'interDef':
                                configChange.direction = 'right';
                                var indexes = [1];
                                var curpos = 0;
                                var os = [];
                                var temp;
                                var messages = [];
                                var order;

                                // find edges
                                var startLine = i + 1;
                                var endLine = i + 1;
                                while (endLine < lines.length) {
                                    if (lines[endLine].indexOf('}') !== -1)
                                        break;
                                    endLine = endLine + 1;
                                }
                                i = endLine;

                                // handle messages
                                for (var j = startLine; j < endLine; j++) {
                                    order = lines[j].trim();
                                    if (order === 'end') {
                                        indexes[curpos] = 1;
                                        curpos--;
                                        indexes[curpos]++;
                                    } else if (order.indexOf('new') !== -1) {
                                        curpos = order.match(/[#]/g).length - 1;
                                        for (var k = 0; k <= curpos; k++) {
                                            if ((typeof indexes[k]) === 'undefined') {
                                                indexes[k] = 1;
                                            }
                                        }
                                        indexes[curpos] = 1;
                                    } else {
                                        if (order.indexOf('->') === -1) {
                                            var res = getTNT(order);
                                            var type, name, title;
                                            type = res.type;
                                            name = res.name;
                                            title = res.title;
                                            if (!isNodeExist(curcomp, name)) {
                                                var node = new UmlNode(type, name, title);
                                                curcomp.nodes.push(node);
                                                os.push(name);
                                            }
                                        } else {
                                            var start, end, message;
                                            var res;
                                            var parts = splitToParts(order);

                                            temp = parts[0];
                                            res = getTNT(temp.trim());
                                            start = res.name;
                                            if (!isNodeExist(curcomp, start)) {
                                                var node = new UmlNode(res.type, res.name, res.title);
                                                curcomp.nodes.push(node);
                                                os.push(start);
                                            }
                                            temp = parts[2];
                                            res = getTNT(temp.trim());
                                            end = res.name;
                                            if (!isNodeExist(curcomp, end)) {
                                                var node = new UmlNode(res.type, res.name, res.title);
                                                curcomp.nodes.push(node);
                                                os.push(end);
                                            }
                                            if (parts.length > 3) {
                                                message = parts[3].trim().replace(/[\[\]]/g, '');
                                            } else {
                                                message = '';
                                            }
                                            if (message !== '') {
                                                var m, n;
                                                var row;
                                                var number = '';
                                                m = os.indexOf(start);
                                                n = os.indexOf(end);
                                                row = m < n ? '->' : '<-';
                                                // add message
                                                if (m > n) {
                                                    m = m + n;
                                                    n = m - n;
                                                    m = m - n;
                                                }
                                                if ((typeof messages[m]) === 'undefined')
                                                    messages[m] = [];
                                                if ((typeof messages[m][n]) === 'undefined')
                                                    messages[m][n] = [];
                                                for (var k = 0; k <= curpos; k++) {
                                                    if ((typeof indexes[k]) === 'undefined')
                                                        indexes[k] = 1;
                                                    if (number !== '')
                                                        number = number + '.' + indexes[k].toString();
                                                    else
                                                        number = number + indexes[k].toString();
                                                }
                                                indexes[curpos]++;
                                                messages[m][n].push(row + number + ' ' + message);
                                            }
                                        }
                                    }
                                }
                                // build relations
                                var t1, t2, t3;
                                for (t1 = 0; t1 < os.length; t1++) {
                                    for (t2 = t1 + 1; t2 < os.length; t2++) {
                                        if ((typeof messages[t1] !== 'undefined') && (typeof messages[t1][t2]) !== 'undefined') {
                                            var messagename = '_label' + labelid;
                                            labelid++;
                                            var node = new UmlNode('LABEL', messagename);
                                            node.compartments[0].lines = [];
                                            for (t3 = 0; t3 < messages[t1][t2].length; t3++)
                                                node.compartments[0].lines.push(messages[t1][t2][t3]);
                                            curcomp.nodes.push(node);
                                            var r1 = new Relation('-', os[t1], messagename, '', '');
                                            var r2 = new Relation('-', messagename, os[t2], '', '');
                                            curcomp.relations.push(r1);
                                            curcomp.relations.push(r2);
                                        }
                                    }
                                }
                                break;
                            case 'configChange':
                                var parts = l.replace('#', '').split(':');
                                configChange[parts[0]] = parts[1];
                                break;
                            default:
                                break;
                        }
                    }
                }

                graph = stack[0];
                for (var i in graph.relations) {
                    graph.relations[i].assoc = graph.relations[i].assoc.replace('@', 'o');
                }

                function splitToParts(src) {
                    var res = [];
                    var temp = src.trim();
                    var part;
                    while (temp.length > 0) {
                        part = getPart(temp);
                        res.push(part);
                        temp = temp.replace(part, '').trim();
                    }
                    return res;
                }

                function getPart(src) {
                    var find1 = false;
                    var find2 = false;
                    for (var i = 0; i < src.length; i++) {
                        if (src[i] === ' ' && !find1 && !find2)
                            break;
                        if (src[i] === '(')
                            find1 = true;
                        if (src[i] === ')')
                            find1 = false;
                        if (src[i] === '[')
                            find2 = true;
                        if (src[i] === ']')
                            find2 = false;
                    }
                    return src.slice(0, i);
                }

                function getTNT(src) {
                    var type, name, title;
                    var parts;
                    var temp = src;
                    if (/^<.+>/.test(src) === true) {
                        type = src.match(/^<.+>/)[0];
                        temp = temp.replace(type, '').trim();
                        type = type.slice(1, -1).toUpperCase();
                    } else {
                        type = 'CLASS';
                    }
                    parts = temp.split('(');
                    name = parts[0].trim();
                    if (parts.length > 1) {
                        title = parts[1].replace(')', '').trim();
                    } else {
                        title = name;
                    }
                    return {
                        type: type,
                        name: name,
                        title: title
                    };
                }

                function isNodeExist(compartment, name) {
                    for (var i in compartment.nodes) {
                        if (compartment.nodes[i].name === name)
                            return true;
                    }
                    return false;
                }

                function makeNodeExist(name, type = 'CLASS', title) {
                    if (isNodeExist(curcomp, name))
                        return;
                    var t = title || name;
                    var node = new UmlNode(type, name, t);
                    curcomp.nodes.push(node);
                    return;
                }

                function UmlNode(type, name, title) {
                    this.type = type;
                    this.name = name;
                    this.compartments = [];
                    var t = new Compartment();
                    t.lines[0] = title || name;
                    this.compartments.push(t);
                }

                function Relation(assoc, start, end, startLabel, endLabel) {
                    this.id = relationid;
                    relationid = relationid + 1;
                    this.assoc = assoc;
                    this.start = start;
                    this.end = end;
                    this.startLabel = startLabel || "";
                    this.endLabel = endLabel || "";
                }

                function Compartment() {
                    this.lines = [];
                    this.nodes = [];
                    this.relations = [];
                }
            }

            function initialStyle() {
                styles = {
                    ABSTRACT: {
                        center: 1,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 1,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'class'
                    },
                    ACTOR: {
                        center: 1,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'actor'
                    },
                    CHOICE: {
                        center: 1,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'rhomb'
                    },
                    CLASS: {
                        center: 1,
                        bold: 1,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'class'
                    },
                    DATABASE: {
                        center: 1,
                        bold: 1,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'database'
                    },
                    END: {
                        center: 1,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 1,
                        hull: 'icon',
                        visual: 'end'
                    },
                    FRAME: {
                        center: 0,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'frame'
                    },
                    HIDDEN: {
                        center: 1,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 1,
                        hull: 'empty',
                        visual: 'hidden'
                    },
                    INPUT: {
                        center: 1,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'input'
                    },
                    INSTANCE: {
                        center: 1,
                        bold: 0,
                        direction: null,
                        underline: 1,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'class'
                    },
                    LABEL: {
                        center: 0,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'none'
                    },
                    NOTE: {
                        center: 0,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'note'
                    },
                    PACKAGE: {
                        center: 0,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'package'
                    },
                    RECEIVER: {
                        center: 0,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'receiver'
                    },
                    REFERENCE: {
                        center: 1,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 1,
                        empty: 0,
                        hull: 'auto',
                        visual: 'class'
                    },
                    SENDER: {
                        center: 0,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'sender'
                    },
                    START: {
                        center: 1,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 1,
                        hull: 'icon',
                        visual: 'start'
                    },
                    STATE: {
                        center: 1,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'roundrect'
                    },
                    TRANSCEIVER: {
                        center: 0,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'transceiver'
                    },
                    USECASE: {
                        center: 1,
                        bold: 0,
                        direction: null,
                        underline: 0,
                        italic: 0,
                        dashed: 0,
                        empty: 0,
                        hull: 'auto',
                        visual: 'ellipse'
                    },
                }
            }

            function initialVisualizer() {
                visualizers = {
                    actor: function (node, x, y, padding, config, g) {
                        var a = padding / 2;
                        var yp = y + a / 2;
                        var actorCenter = {
                            x: node.x,
                            y: yp - a
                        };
                        g.circle(actorCenter, a).fillAndStroke();
                        g.path([{
                            x: node.x,
                            y: yp
                        }, {
                            x: node.x,
                            y: yp + 2 * a
                        }]).stroke();
                        g.path([{
                            x: node.x - a,
                            y: yp + a
                        }, {
                            x: node.x + a,
                            y: yp + a
                        }]).stroke();
                        g.path([{
                                x: node.x - a,
                                y: yp + a + padding
                            },
                            {
                                x: node.x,
                                y: yp + padding
                            },
                            {
                                x: node.x + a,
                                y: yp + a + padding
                            }
                        ]).stroke();
                    },
                    class: function (node, x, y, padding, config, g) {
                        g.rect(x, y, node.width, node.height).fillAndStroke();
                    },
                    database: function (node, x, y, padding, config, g) {
                        var cy = y - padding / 2;
                        var pi = 3.1416;
                        g.rect(x, y, node.width, node.height).fill();
                        g.path([{
                            x: x,
                            y: cy
                        }, {
                            x: x,
                            y: cy + node.height
                        }]).stroke();
                        g.path([{
                            x: x + node.width,
                            y: cy
                        }, {
                            x: x + node.width,
                            y: cy + node.height
                        }]).stroke();
                        g.ellipse({
                            x: node.x,
                            y: cy
                        }, node.width, padding * 1.5).fillAndStroke();
                        g.ellipse({
                            x: node.x,
                            y: cy + node.height
                        }, node.width, padding * 1.5, 0, pi).fillAndStroke();
                    },
                    ellipse: function (node, x, y, padding, config, g) {
                        g.ellipse({
                            x: node.x,
                            y: node.y
                        }, node.width, node.height).fillAndStroke();
                    },
                    end: function (node, x, y, padding, config, g) {
                        g.circle(node.x, y + node.height / 2, node.height / 3).fillAndStroke();
                        g.fillStyle(config.stroke);
                        g.circle(node.x, y + node.height / 2, node.height / 3 - padding / 2).fill();
                    },
                    frame: function (node, x, y, padding, config, g) {
                        g.rect(x, y, node.width, node.height).fillAndStroke();
                    },
                    hidden: function (node, x, y, padding, config, g) {},
                    input: function (node, x, y, padding, config, g) {
                        g.circuit([{
                                x: x + padding,
                                y: y
                            },
                            {
                                x: x + node.width,
                                y: y
                            },
                            {
                                x: x + node.width - padding,
                                y: y + node.height
                            },
                            {
                                x: x,
                                y: y + node.height
                            }
                        ]).fillAndStroke();
                    },
                    none: function (node, x, y, padding, config, g) {},
                    note: function (node, x, y, padding, config, g) {
                        g.circuit([{
                                x: x,
                                y: y
                            },
                            {
                                x: x + node.width - padding,
                                y: y
                            },
                            {
                                x: x + node.width,
                                y: y + padding
                            },
                            {
                                x: x + node.width,
                                y: y + node.height
                            },
                            {
                                x: x,
                                y: y + node.height
                            },
                            {
                                x: x,
                                y: y
                            }
                        ]).fillAndStroke();
                        g.path([{
                                x: x + node.width - padding,
                                y: y
                            },
                            {
                                x: x + node.width - padding,
                                y: y + padding
                            },
                            {
                                x: x + node.width,
                                y: y + padding
                            }
                        ]).stroke();
                    },
                    package: function (node, x, y, padding, config, g) {
                        var headHeight = node.compartments[0].height;
                        g.rect(x, y + headHeight, node.width, node.height - headHeight).fillAndStroke();
                        var w = g.measureText(node.name).width + 2 * padding;
                        g.circuit([{
                                x: x,
                                y: y + headHeight
                            },
                            {
                                x: x,
                                y: y
                            },
                            {
                                x: x + w,
                                y: y
                            },
                            {
                                x: x + w,
                                y: y + headHeight
                            }
                        ]).fillAndStroke();
                    },
                    receiver: function (node, x, y, padding, config, g) {
                        g.circuit([{
                                x: x - padding,
                                y: y
                            },
                            {
                                x: x + node.width,
                                y: y
                            },
                            {
                                x: x + node.width,
                                y: y + node.height
                            },
                            {
                                x: x - padding,
                                y: y + node.height
                            },
                            {
                                x: x,
                                y: y + node.height / 2
                            },
                        ]).fillAndStroke();
                    },
                    rhomb: function (node, x, y, padding, config, g) {
                        g.circuit([{
                                x: node.x,
                                y: y - padding
                            },
                            {
                                x: x + node.width + padding,
                                y: node.y
                            },
                            {
                                x: node.x,
                                y: y + node.height + padding
                            },
                            {
                                x: x - padding,
                                y: node.y
                            }
                        ]).fillAndStroke();
                    },
                    roundrect: function (node, x, y, padding, config, g) {
                        var r = Math.min(padding * 2 * config.leading, node.height / 2);
                        g.roundRect(x, y, node.width, node.height, r).fillAndStroke();
                    },
                    sender: function (node, x, y, padding, config, g) {
                        g.circuit([{
                                x: x,
                                y: y
                            },
                            {
                                x: x + node.width - padding,
                                y: y
                            },
                            {
                                x: x + node.width,
                                y: y + node.height / 2
                            },
                            {
                                x: x + node.width - padding,
                                y: y + node.height
                            },
                            {
                                x: x,
                                y: y + node.height
                            }
                        ]).fillAndStroke();
                    },
                    start: function (node, x, y, padding, config, g) {
                        g.fillStyle(config.stroke);
                        g.circle(node.x, y + node.height / 2, node.height / 2.5).fill();
                    },
                    transceiver: function (node, x, y, padding, config, g) {
                        g.circuit([{
                                x: x - padding,
                                y: y
                            },
                            {
                                x: x + node.width,
                                y: y
                            },
                            {
                                x: x + node.width + padding,
                                y: y + node.height / 2
                            },
                            {
                                x: x + node.width,
                                y: y + node.height
                            },
                            {
                                x: x - padding,
                                y: y + node.height
                            },
                            {
                                x: x,
                                y: y + node.height / 2
                            }
                        ]).fillAndStroke();
                    },
                }
            }

            function getConfig(configChange) {
                function directionToDagre(word) {
                    return {
                        down: 'TB',
                        right: 'LR'
                    } [word] || 'TB';
                }
                var d = configChange;
                return {
                    arrowSize: +d.arrowSize || 1,
                    bendSize: +d.bendSize || 0.3,
                    direction: directionToDagre(d.direction),
                    gutter: +d.gutter || 5,
                    edgeMargin: (+d.edgeMargin) || 0,
                    edges: {
                        hard: 'hard',
                        rounded: 'rounded'
                    } [d.edges] || 'rounded',
                    fill: (d.fill || '#eee8d5;#fdf6e3;#eee8d5;#fdf6e3').split(';'),
                    fillArrows: d.fillArrows === 'true',
                    font: d.font || 'Calibri',
                    fontSize: (+d.fontSize) || 12,
                    leading: (+d.leading) || 1.25,
                    lineWidth: (+d.lineWidth) || 3,
                    padding: (+d.padding) || 8,
                    spacing: (+d.spacing) || 40,
                    stroke: d.stroke || '#33322E',
                    title: d.title || 'nomnoml',
                    zoom: +d.zoom || 1,
                };
            }

            function setFont(config, isBold, isItalic) {
                var style = (isBold === 'bold' ? 'bold' : '');
                if (isItalic)
                    style = 'italic ' + style;
                var defFont = 'Helvetica, sans-serif';
                var f = 'font-weight:' + style + ';' +
                    'font-size:' + config.fontSize + 'pt;' +
                    'font-family:\'' + config.font + '\', ' + defFont;
                svg.font(f);
            }

            function textWidth(s) {
                return svg.measureText(s).width;
            }

            function textHeight() {
                return config.leading * config.fontSize;
            }

            function calculateLayout() {
                layoutCompartment(graph, 0, styles.CLASS);

                function runDagree(input, style) {
                    return dagre.layout()
                        .rankSep(config.spacing)
                        .nodeSep(config.spacing)
                        .edgeSep(config.spacing)
                        .rankDir(style.direction || config.direction)
                        .run(input);
                }

                function measureLines(lines, fontWeight) {
                    if (lines.length === 0)
                        return {
                            width: 0,
                            height: config.padding
                        };
                    setFont(config, fontWeight);
                    var w = lines.map(textWidth);
                    var res = w[0];
                    for (var i = 0; i < w.length; i++) {
                        res = (res > w[i] ? res : w[i]);
                    }
                    return {
                        width: Math.round(res + 2 * config.padding),
                        height: Math.round(textHeight() * lines.length + 2 * config.padding)
                    };
                }

                function layoutCompartment(c, index, style) {
                    var textSize = measureLines(c.lines, index ? 'normal' : 'bold');
                    c.width = textSize.width;
                    c.height = textSize.height;

                    if (c.nodes.length === 0 && c.relations.length === 0)
                        return;

                    myFor(c.nodes, layoutClassifier);

                    var g = new dagre.Digraph();
                    myFor(c.nodes, (n) => {
                        g.addNode(n.name, {
                            width: n.width,
                            height: n.height
                        });
                    });
                    myFor(c.relations, (r) => {
                        g.addEdge(r.id, r.start, r.end);
                    });
                    var dLayout = runDagree(g, style);

                    var rs = myIndexBy(c.relations, 'id');
                    var ns = myIndexBy(c.nodes, 'name');

                    dLayout.eachNode(function (u, value) {
                        ns[u].x = value.x;
                        ns[u].y = value.y;
                    });

                    dLayout.eachEdge(function (e, u, v, value) {
                        var start = ns[u],
                            end = ns[v];
                        var ps;
                        ps = [];
                        ps.push(start);
                        for (var index in value.points) {
                            ps.push(value.points[index]);
                        }
                        ps.push(end);
                        rs[e].path = ps.map(toPoint);
                    });

                    var res = dLayout.graph();
                    var resHeight = res.height ? res.height + 2 * config.gutter : 0;
                    var resWidth = res.width ? res.width + 2 * config.gutter : 0;

                    c.width = Math.max(textSize.width, resWidth) + 2 * config.padding;
                    c.height = textSize.height + resHeight + config.padding;

                    function toPoint(o) {
                        return {
                            x: o.x,
                            y: o.y
                        };
                    }
                }

                function layoutClassifier(c) {
                    var style = styles[c.type] || styles.CLASS;
                    switch (style.hull) {
                        case 'icon':
                            c.width = config.fontSize * 2.5;
                            c.height = config.fontSize * 2.5;
                            break;
                        case 'empty':
                            c.width = 0;
                            c.height = 0;
                            break;
                        default:
                            myFor(c.compartments, (c, i) => {
                                layoutCompartment(c, i, style);
                            });

                            c.width = c.compartments[0].width;
                            for (var i = 1; i < c.compartments.length; i++)
                                c.width = (c.width > c.compartments[i].width ? c.width : c.compartments[i].width);

                            c.height = mySum(c.compartments, 'height');
                            c.x = c.width / 2;
                            c.y = c.height / 2;

                            myFor(c.compartments, (co) => {
                                co.width = c.width;
                            });
                            break;
                    }
                }
            }

            function render() {
                var padding = config.padding;
                var g = svg;
                var vm = vector;
                var empty = false,
                    filled = true,
                    diamond = true;

                g.clear();
                setFont(config, 'bold');
                g.save();
                g.lineWidth(config.lineWidth);
                g.lineJoin('round');
                g.lineCap('round');
                g.strokeStyle(config.stroke);
                g.scale(config.zoom, config.zoom);
                snapToPixels();
                renderCompartment(graph, {}, 0);
                g.restore();

                function renderCompartment(compartment, style, level) {
                    var i;
                    g.save();
                    g.translate(padding, padding);
                    g.fillStyle(style.stroke || config.stroke);
                    for (i = 0; i < compartment.lines.length; i++) {
                        var text = compartment.lines[i];

                        g.textAlign(style.center ? 'center' : 'left');
                        var x = (style.center ? compartment.width / 2 - padding : 0);
                        var y = (0.5 + (i + 0.5) * config.leading) * config.fontSize;
                        if (text !== '')
                            g.fillText(text, x, y);
                        if (style.underline) {
                            var w = g.measureText(text).width;
                            y += Math.round(config.fontSize * 0.2) + 0.5;
                            g.path([{
                                x: x - w / 2,
                                y: y
                            }, {
                                x: x + w / 2,
                                y: y
                            }]).stroke();
                            g.lineWidth = config.lineWidth;
                        }
                    }
                    g.translate(config.gutter, config.gutter);
                    for (i = 0; i < compartment.relations.length; i++) {
                        renderRelation(compartment.relations[i], compartment);
                    }
                    for (i = 0; i < compartment.nodes.length; i++) {
                        renderNode(compartment.nodes[i], level);
                    }
                    g.restore();
                }

                function renderNode(node, level) {
                    var x = Math.round(node.x - node.width / 2);
                    var y = Math.round(node.y - node.height / 2);
                    var style = styles[node.type] || styles.CLASS;

                    g.fillStyle(style.fill || config.fill[level] || myLast(config.fill));
                    g.strokeStyle(style.stroke || config.stroke);
                    if (style.dashed) {
                        var dash = Math.max(4, 2 * config.lineWidth);
                        g.setLineDash([dash, dash]);
                    }
                    var drawFunc = visualizers[style.visual] || visualizers.class;
                    drawFunc(node, x, y, padding, config, g);
                    g.setLineDash([]);

                    var yDivider = (style.visual === 'actor' ? y + padding * 3 / 4 : y);
                    myFor(node.compartments, (part, i) => {
                        var s = i > 0 ? {
                            stroke: style.stroke
                        } : style;
                        if (s.empty)
                            return;
                        g.save();
                        g.translate(x, yDivider);
                        setFont(config, s.bold ? 'bold' : 'normal', s.italic);
                        renderCompartment(part, s, level + 1);
                        g.restore();
                        if (i === node.compartments.length - 1)
                            return;
                        yDivider += part.height;
                        if (style.visual === 'frame' && i === 0) {
                            var w = g.measureText(node.name).width + part.height / 2 + padding;
                            g.path([{
                                    x: x,
                                    y: yDivider
                                },
                                {
                                    x: x + w - part.height / 2,
                                    y: yDivider
                                },
                                {
                                    x: x + w,
                                    y: yDivider - part.height / 2
                                },
                                {
                                    x: x + w,
                                    y: yDivider - part.height
                                }
                            ]).stroke();
                        } else {
                            g.path([{
                                    x: x,
                                    y: yDivider
                                },
                                {
                                    x: x + node.width,
                                    y: yDivider
                                }
                            ]).stroke();
                        }
                    });
                }

                function strokePath(p) {
                    if (config.edges === 'rounded') {
                        var radius = config.spacing * config.bendSize;
                        g.beginPath();
                        g.moveTo(p[0].x, p[0].y);

                        for (var i = 1; i < p.length - 1; i++)
                            g.arcTo(p[i].x, p[i].y, p[i + 1].x, p[i + 1].y, radius);

                        g.lineTo(myLast(p).x, myLast(p).y);
                        g.stroke();
                    } else
                        g.path(p).stroke();
                }

                function renderLabel(text, pos, quadrant) {
                    if (text !== '') {
                        var fontSize = config.fontSize;
                        var lines = text.split('`');
                        var area = {
                            width: myMax(lines.map(l => {
                                return g.measureText(l).width;
                            })),
                            height: fontSize * lines.length
                        };
                        var origin = {
                            x: pos.x + ((quadrant === 1 || quadrant === 4) ? padding : -area.width - padding),
                            y: pos.y + ((quadrant === 3 || quadrant === 4) ? padding : -area.height - padding)
                        };
                        myFor(lines, (l, i) => {
                            g.fillText(l, origin.x, origin.y + fontSize * (i + 1));
                        });
                    }
                }

                function quadrant(point, rect, def) {
                    if (point.x < rect.x && point.y < rect.y - rect.height / 2) return 1;
                    if (point.y > rect.y && point.x > rect.x + rect.width / 2) return 1;

                    if (point.x > rect.x && point.y < rect.y - rect.height / 2) return 2;
                    if (point.y > rect.y && point.x < rect.x - rect.width / 2) return 2;

                    if (point.x > rect.x && point.y > rect.y + rect.height / 2) return 3;
                    if (point.y < rect.y && point.x < rect.x - rect.width / 2) return 3;

                    if (point.x < rect.x && point.y > rect.y + rect.height / 2) return 4;
                    if (point.y < rect.y && point.x > rect.x + rect.width / 2) return 4;

                    return def;
                }

                function adjustQuadrant(quadrant, point, opposite) {
                    if ((opposite.x == point.x) || (opposite.y == point.y)) return quadrant;
                    var flipHorizontally = [4, 3, 2, 1];
                    var flipVertically = [2, 1, 4, 3];
                    var oppositeQuadrant = (opposite.y < point.y) ?
                        ((opposite.x < point.x) ? 2 : 1) :
                        ((opposite.x < point.x) ? 3 : 4);
                    if (oppositeQuadrant === quadrant) {
                        if (config.direction === 'LR') return flipHorizontally[quadrant - 1];
                        if (config.direction === 'TD') return flipVertically[quadrant - 1];
                    }
                    return quadrant;
                }

                function renderRelation(r, compartment) {
                    var startNode = null,
                        endNode = null;
                    for (var i = 0; i < compartment.nodes.length; i++) {
                        if (compartment.nodes[i].name === r.start && startNode === null)
                            startNode = compartment.nodes[i];
                        if (compartment.nodes[i].name === r.end && endNode === null)
                            endNode = compartment.nodes[i];
                    }
                    var start = rectIntersection(r.path[1], r.path[0], startNode);
                    var end = rectIntersection(r.path[r.path.length - 2], r.path[r.path.length - 1], endNode);

                    var path = [];
                    path.push(start);
                    for (var j = 1; j < r.path.length - 1; j++)
                        path.push(r.path[j]);
                    path.push(end);

                    g.fillStyle(config.stroke);
                    setFont(config, 'normal');

                    renderLabel(r.startLabel, start, adjustQuadrant(quadrant(start, startNode, 4), start, end));
                    renderLabel(r.endLabel, end, adjustQuadrant(quadrant(end, endNode, 2), end, start));

                    if (r.assoc !== '-/-') {
                        if (r.assoc.indexOf('--') !== -1) {
                            var dash = Math.max(4, 2 * config.lineWidth);
                            g.setLineDash([dash, dash]);
                            strokePath(path);
                            g.setLineDash([]);
                        } else
                            strokePath(path);
                    }

                    var tokens = r.assoc.split('-');
                    drawArrowEnd(myLast(tokens), path, end);
                    drawArrowEnd(tokens[0], path.reverse(), start);
                }

                function rectIntersection(p1, p2, rect) {
                    if (rect.width || rect.height) {
                        var xBound = rect.width / 2 + config.edgeMargin;
                        var yBound = rect.height / 2 + config.edgeMargin;
                        var delta = vm.diff(p1, p2);
                        var t;
                        if (delta.x && delta.y) {
                            t = Math.min(Math.abs(xBound / delta.x), Math.abs(yBound / delta.y));
                        } else {
                            t = Math.abs(delta.x ? xBound / delta.x : yBound / delta.y);
                        }
                        return vm.add(p2, vm.mult(delta, t));
                    }
                    return p2;
                }

                function drawArrow(path, isOpen, arrowPoint, diamond) {
                    var size = (config.spacing - 2 * config.edgeMargin) * config.arrowSize / 30;
                    var v = vm.diff(path[path.length - 2], myLast(path));
                    var nv = vm.normalize(v);

                    function getArrowBase(s) {
                        return vm.add(arrowPoint, vm.mult(nv, s * size));
                    }

                    var arrowBase = getArrowBase(diamond ? 7 : 10);
                    var t = vm.rot(nv);
                    var arrowButt = (diamond) ? getArrowBase(14) :
                        (isOpen && !config.fillArrows) ? getArrowBase(5) : arrowBase;
                    var arrow = [
                        vm.add(arrowBase, vm.mult(t, 4 * size)),
                        arrowButt,
                        vm.add(arrowBase, vm.mult(t, -4 * size)),
                        arrowPoint
                    ];
                    g.fillStyle(isOpen ? config.stroke : config.fill[0]);
                    g.circuit(arrow).fillAndStroke();
                }

                function drawArrowEnd(id, path, end) {
                    if (id === '>' || id === '<')
                        drawArrow(path, filled, end);
                    else if (id === ':>' || id === '<:')
                        drawArrow(path, empty, end);
                    else if (id === '+')
                        drawArrow(path, filled, end, diamond);
                    else if (id === 'o')
                        drawArrow(path, empty, end, diamond);
                }

                function snapToPixels() {
                    if (config.lineWidth % 2 === 1)
                        g.translate(0.5, 0.5);
                }
            }
        }

        // svg
        function SVG() {
            var globalStyle = '';
            var initialState = {
                x: 0,
                y: 0,
                stroke: 'none',
                dashArray: 'none',
                fill: 'none',
                textAlign: 'left'
            };
            var states = [initialState];
            var elements = [];
            var docFont = '';

            function Element(name, attr, content) {
                attr.style = attr.style || '';
                return {
                    name: name,
                    attr: attr,
                    content: content || undefined,
                    stroke: function () {
                        this.attr.style += 'stroke:' + lastDefined('stroke') + ';' + 'fill:' + 'none' + ';' + 'stroke-dasharray:' + lastDefined('dashArray') + ';';
                        return this;
                    },
                    fill: function () {
                        this.attr.style += 'stroke:' + 'none' + ';' + 'fill:' + lastDefined('fill') + ';';
                        return this;
                    },
                    fillAndStroke: function () {
                        this.attr.style += 'stroke:' + lastDefined('stroke') + ';' + 'fill:' + lastDefined('fill') + ';' + 'stroke-dasharray:' + lastDefined('dashArray') + ';';
                        return this;
                    }
                }
            }

            function State(nx, ny) {
                return {
                    x: nx,
                    y: ny,
                    stroke: null,
                    fill: null,
                    textAlign: null
                };
            }

            function trans(coord, property) {
                for (var i = 0; i < states.length; i++)
                    coord += states[i][property];
                return coord;
            }

            function tX(coord) {
                return Math.round(10 * trans(coord, 'x')) / 10;
            }

            function tY(coord) {
                return Math.round(10 * trans(coord, 'y')) / 10;
            }

            function lastDefined(property) {
                for (var i = states.length - 1; i >= 0; i--)
                    if (states[i][property])
                        return states[i][property];
                return undefined;
            }

            function tracePath(path, offset, s) {
                s = (s === undefined ? 1 : s);
                offset = offset || {
                    x: 0,
                    y: 0
                };
                var d = path.map(
                    function (e, i) {
                        return (i ? 'L' : 'M') + tX(offset.x + s * e.x) + ' ' + tY(offset.y + s * e.y);
                    }
                ).join(' ');
                return newElement('path', {
                    d: d
                });
            }

            function newElement(type, attr, content) {
                var element = Element(type, attr, content);
                elements.push(element);
                return element;
            }

            this.background = function () {}

            this.clear = function () {}

            this.circle = function (x, y, r) {
                var attr;
                if (arguments.length === 2) {
                    attr = {
                        r: y,
                        cx: tX(x.x),
                        cy: tY(x.y)
                    };
                } else {
                    attr = {
                        r: r,
                        cx: tX(x),
                        cy: tY(y)
                    };
                }
                return newElement('circle', attr);
            }

            this.ellipse = function (center, w, h, start, stop) {
                if (stop) {
                    var y = tY(center.y);
                    return newElement('path', {
                        d: 'M' + tX(center.x - w / 2) + ' ' + y + 'A' + w / 2 + ' ' + h / 2 + ' 0 1 0 ' + tX(center.x + w / 2) + ' ' + y
                    });
                } else {
                    return newElement('ellipse', {
                        cx: tX(center.x),
                        cy: tY(center.y),
                        rx: w / 2,
                        ry: h / 2
                    });
                }
            }

            this.arc = function (x, y, r) {
                return newElement('ellipse', {
                    cx: tX(x),
                    cy: tY(y),
                    rx: r,
                    ry: r
                });
            }

            this.roundRect = function (x, y, w, h, r) {
                return newElement('rect', {
                    x: tX(x),
                    y: tY(y),
                    rx: r,
                    ry: r,
                    height: h,
                    width: w
                });
            }

            this.rect = function (x, y, w, h) {
                return newElement('rect', {
                    x: tX(x),
                    y: tY(y),
                    height: h,
                    width: w
                });
            }

            this.path = tracePath;

            this.circuit = function (path, offset, s) {
                var element = tracePath(path, offset, s);
                element.attr.d += ' Z';
                return element;
            }

            this.font = function (font) {
                myLast(states).font = font;
            }

            this.strokeStyle = function (stroke) {
                myLast(states).stroke = stroke;
            }

            this.fillStyle = function (fill) {
                myLast(states).fill = fill;
            }

            this.arcTo = function (x1, y1, x2, y2) {
                myLast(elements).attr.d += ('L' + tX(x1) + ' ' + tY(y1) + ' L' + tX(x2) + ' ' + tY(y2) + ' ');
            }

            this.beginPath = function () {
                return newElement('path', {
                    d: ''
                });
            }

            this.fillText = function (text, x, y) {
                if (lastDefined('textAlign') === 'center')
                    x -= this.measureText(text).width / 2;
                var attr = {
                    x: tX(x),
                    y: tY(y),
                    style: ""
                };
                var font = lastDefined('font');
                if (font.indexOf('bold') === -1)
                    attr.style += "font-weight:normal;";
                if (font.indexOf('italic') > -1)
                    attr.style += "font-style:italic;";
                return newElement('text', attr, esSpecialCharacters(text));
            }

            this.lineCap = function (cap) {
                globalStyle += ';stroke-linecap:' + cap;
            }

            this.lineJoin = function (join) {
                globalStyle += ';stroke-linejoin:' + join;
            }

            this.lineTo = function (x, y) {
                myLast(elements).attr.d += ('L' + tX(x) + ' ' + tY(y) + ' ');
            }

            this.lineWidth = function (w) {
                globalStyle += ";stroke-width:" + w;
            }

            this.measureText = function (s) {
                return {
                    width: mySum(s, function (c) {
                        if (c === 'M' || c === 'W')
                            return 14;
                        return c.charCodeAt(0) < 200 ? 9.5 : 16;
                    })
                }
            }

            this.moveTo = function (x, y) {
                myLast(elements).attr.d += ('M' + tX(x) + ' ' + tY(y) + ' ');
            }

            this.restore = function () {
                states.pop();
            }

            this.save = function () {
                states.push(State(0, 0));
            }

            this.scale = function () {}

            this.setLineDash = function (d) {
                myLast(states).dashArray = (d.length === 0) ? 'none' : d[0] + ' ' + d[1];
            }

            this.stroke = function () {
                myLast(elements).stroke();
            }

            this.textAlign = function (a) {
                myLast(states).textAlign = a;
            }

            this.translate = function (dx, dy) {
                myLast(states).x += dx;
                myLast(states).y += dy;
            }

            this.output = function () {
                var attrs = {};
                attrs.version = '1.1';
                attrs.baseProfile = 'full';
                attrs.width = '100%';
                attrs.height = '100%';
                attrs.xmlns = 'http://www.w3.org/2000/svg';
                attrs['xmlns:xlink'] = 'http://www.w3.org/1999/xlink';
                attrs['xmlns:ev'] = 'http://www.w3.org/2001/xml-events';
                attrs.style = lastDefined('font') + ';' + globalStyle;

                function toAttr(obj) {
                    function toKeyValue(key) {
                        return key + '="' + obj[key] + '"';
                    }
                    return Object.keys(obj).map(toKeyValue).join(' ');
                }

                function toHTML(e) {
                    return '<' + e.name + ' ' + toAttr(e.attr) + '>' + (e.content || '') + '</' + e.name + '>';
                }
                var innerSvg = elements.map(toHTML).join('\n');
                return toHTML(Element('svg', attrs, innerSvg));
            }
        }

        // vector
        function Vector() {
            function dist(a, b) {
                return mag(diff(a, b));
            }

            function add(a, b) {
                return {
                    x: a.x + b.x,
                    y: a.y + b.y
                };
            }

            function diff(a, b) {
                return {
                    x: a.x - b.x,
                    y: a.y - b.y
                };
            }

            function mult(v, factor) {
                return {
                    x: factor * v.x,
                    y: factor * v.y
                };
            }

            function mag(v) {
                return Math.sqrt(v.x * v.x + v.y * v.y);
            }

            function normalize(v) {
                return mult(v, 1 / mag(v));
            }

            function rot(a) {
                return {
                    x: a.y,
                    y: -a.x
                };
            }
            this.dist = dist;
            this.add = add;
            this.diff = diff;
            this.mult = mult;
            this.mag = mag;
            this.normalize = normalize;
            this.rot = rot;
        }
    }
}

// dagree min
(function a(b, c, d) {
    function e(g, h) {
        if (!c[g]) {
            if (!b[g]) {
                var j = typeof require == "function" && require;
                if (!h && j) return j(g, !0);
                if (f) return f(g, !0);
                throw new Error("Cannot find module '" + g + "'")
            }
            var k = c[g] = {
                exports: {}
            };
            b[g][0].call(k.exports, function (a) {
                var c = b[g][1][a];
                return e(c ? c : a)
            }, k, k.exports, a, b, c, d)
        }
        return c[g].exports
    }
    var f = typeof require == "function" && require;
    for (var g = 0; g < d.length; g++) e(d[g]);
    return e
})({
    1: [function (a, b, c) {
        var d = typeof self != "undefined" ? self : typeof window != "undefined" ? window : {};
        d.dagre = a("./index")
    }, {
        "./index": 2
    }],
    2: [function (a, b, c) {
        c.Digraph = a("graphlib").Digraph, c.Graph = a("graphlib").Graph, c.layout = a("./lib/layout"), c.version = a("./lib/version")
    }, {
        "./lib/layout": 3,
        "./lib/version": 18,
        graphlib: 24
    }],
    3: [function (a, b, c) {
        var d = a("./util"),
            e = a("./rank"),
            f = a("./order"),
            g = a("graphlib").CGraph,
            h = a("graphlib").CDigraph;
        b.exports = function () {
            function j(a) {
                var c = new h;
                a.eachNode(function (a, b) {
                    b === undefined && (b = {}), c.addNode(a, {
                        width: b.width,
                        height: b.height
                    }), b.hasOwnProperty("rank") && (c.node(a).prefRank = b.rank)
                }), a.parent && a.nodes().forEach(function (b) {
                    c.parent(b, a.parent(b))
                }), a.eachEdge(function (a, b, d, e) {
                    e === undefined && (e = {});
                    var f = {
                        e: a,
                        minLen: e.minLen || 1,
                        width: e.width || 0,
                        height: e.height || 0,
                        points: []
                    };
                    c.addEdge(null, b, d, f)
                });
                var d = a.graph() || {};
                return c.graph({
                    rankDir: d.rankDir || b.rankDir,
                    orderRestarts: d.orderRestarts
                }), c
            }

            function k(a) {
                var g = i.rankSep(),
                    h;
                try {
                    return h = d.time("initLayoutGraph", j)(a), h.order() === 0 ? h : (h.eachEdge(function (a, b, c, d) {
                        d.minLen *= 2
                    }), i.rankSep(g / 2), d.time("rank.run", e.run)(h, b.rankSimplex), d.time("normalize", l)(h), d.time("order", f)(h, b.orderMaxSweeps), d.time("position", c.run)(h), d.time("undoNormalize", m)(h), d.time("fixupEdgePoints", n)(h), d.time("rank.restoreEdges", e.restoreEdges)(h), d.time("createFinalGraph", o)(h, a.isDirected()))
                } finally {
                    i.rankSep(g)
                }
            }

            function l(a) {
                var b = 0;
                a.eachEdge(function (c, d, e, f) {
                    var g = a.node(d).rank,
                        h = a.node(e).rank;
                    if (g + 1 < h) {
                        for (var i = d, j = g + 1, k = 0; j < h; ++j, ++k) {
                            var l = "_D" + ++b,
                                m = {
                                    width: f.width,
                                    height: f.height,
                                    edge: {
                                        id: c,
                                        source: d,
                                        target: e,
                                        attrs: f
                                    },
                                    rank: j,
                                    dummy: !0
                                };
                            k === 0 ? m.index = 0 : j + 1 === h && (m.index = 1), a.addNode(l, m), a.addEdge(null, i, l, {}), i = l
                        }
                        a.addEdge(null, i, e, {}), a.delEdge(c)
                    }
                })
            }

            function m(a) {
                a.eachNode(function (b, c) {
                    if (c.dummy) {
                        if ("index" in c) {
                            var d = c.edge;
                            a.hasEdge(d.id) || a.addEdge(d.id, d.source, d.target, d.attrs);
                            var e = a.edge(d.id).points;
                            e[c.index] = {
                                x: c.x,
                                y: c.y,
                                ul: c.ul,
                                ur: c.ur,
                                dl: c.dl,
                                dr: c.dr
                            }
                        }
                        a.delNode(b)
                    }
                })
            }

            function n(a) {
                a.eachEdge(function (a, b, c, d) {
                    d.reversed && d.points.reverse()
                })
            }

            function o(a, b) {
                var c = b ? new h : new g;
                c.graph(a.graph()), a.eachNode(function (a, b) {
                    c.addNode(a, b)
                }), a.eachNode(function (b) {
                    c.parent(b, a.parent(b))
                }), a.eachEdge(function (a, b, d, e) {
                    c.addEdge(e.e, b, d, e)
                });
                var d = 0,
                    e = 0;
                return a.eachNode(function (b, c) {
                    a.children(b).length || (d = Math.max(d, c.x + c.width / 2), e = Math.max(e, c.y + c.height / 2))
                }), a.eachEdge(function (a, b, c, f) {
                    var g = Math.max.apply(Math, f.points.map(function (a) {
                            return a.x
                        })),
                        h = Math.max.apply(Math, f.points.map(function (a) {
                            return a.y
                        }));
                    d = Math.max(d, g + f.width / 2), e = Math.max(e, h + f.height / 2)
                }), c.graph().width = d, c.graph().height = e, c
            }

            function p(a) {
                return function () {
                    return arguments.length ? (a.apply(null, arguments), i) : a()
                }
            }
            var b = {
                    debugLevel: 0,
                    orderMaxSweeps: f.DEFAULT_MAX_SWEEPS,
                    rankSimplex: !1,
                    rankDir: "TB"
                },
                c = a("./position")(),
                i = {};
            return i.orderIters = d.propertyAccessor(i, b, "orderMaxSweeps"), i.rankSimplex = d.propertyAccessor(i, b, "rankSimplex"), i.nodeSep = p(c.nodeSep), i.edgeSep = p(c.edgeSep), i.universalSep = p(c.universalSep), i.rankSep = p(c.rankSep), i.rankDir = d.propertyAccessor(i, b, "rankDir"), i.debugAlignment = p(c.debugAlignment), i.debugLevel = d.propertyAccessor(i, b, "debugLevel", function (a) {
                d.log.level = a, c.debugLevel(a)
            }), i.run = d.time("Total layout", k), i._normalize = l, i
        }
    }, {
        "./order": 4,
        "./position": 9,
        "./rank": 10,
        "./util": 17,
        graphlib: 24
    }],
    4: [function (a, b, c) {
        function k(a, b) {
            function o() {
                a.eachNode(function (a, b) {
                    m[a] = b.order
                })
            }
            arguments.length < 2 && (b = j);
            var c = a.graph().orderRestarts || 0,
                h = f(a);
            h.forEach(function (b) {
                b = b.filterNodes(function (b) {
                    return !a.children(b).length
                })
            });
            var i = 0,
                k, l = Number.MAX_VALUE,
                m = {};
            for (var p = 0; p < Number(c) + 1 && l !== 0; ++p) {
                k = Number.MAX_VALUE, g(a, c > 0), d.log(2, "Order phase start cross count: " + a.graph().orderInitCC);
                var q, r, s;
                for (q = 0, r = 0; r < 4 && q < b && k > 0; ++q, ++r, ++i) n(a, h, q), s = e(a), s < k && (r = 0, k = s, s < l && (o(), l = s)), d.log(3, "Order phase start " + p + " iter " + q + " cross count: " + s)
            }
            Object.keys(m).forEach(function (b) {
                if (!a.children || !a.children(b).length) a.node(b).order = m[b]
            }), a.graph().orderCC = l, d.log(2, "Order iterations: " + i), d.log(2, "Order phase best cross count: " + a.graph().orderCC)
        }

        function l(a, b) {
            var c = {};
            return b.forEach(function (b) {
                c[b] = a.inEdges(b).map(function (b) {
                    return a.node(a.source(b)).order
                })
            }), c
        }

        function m(a, b) {
            var c = {};
            return b.forEach(function (b) {
                c[b] = a.outEdges(b).map(function (b) {
                    return a.node(a.target(b)).order
                })
            }), c
        }

        function n(a, b, c) {
            c % 2 === 0 ? o(a, b, c) : p(a, b, c)
        }

        function o(a, b) {
            var c;
            for (i = 1; i < b.length; ++i) c = h(b[i], c, l(a, b[i].nodes()))
        }

        function p(a, b) {
            var c;
            for (i = b.length - 2; i >= 0; --i) h(b[i], c, m(a, b[i].nodes()))
        }
        var d = a("./util"),
            e = a("./order/crossCount"),
            f = a("./order/initLayerGraphs"),
            g = a("./order/initOrder"),
            h = a("./order/sortLayer");
        b.exports = k;
        var j = 24;
        k.DEFAULT_MAX_SWEEPS = j
    }, {
        "./order/crossCount": 5,
        "./order/initLayerGraphs": 6,
        "./order/initOrder": 7,
        "./order/sortLayer": 8,
        "./util": 17
    }],
    5: [function (a, b, c) {
        function e(a) {
            var b = 0,
                c = d.ordering(a);
            for (var e = 1; e < c.length; ++e) b += f(a, c[e - 1], c[e]);
            return b
        }

        function f(a, b, c) {
            var d = [];
            b.forEach(function (b) {
                var c = [];
                a.outEdges(b).forEach(function (b) {
                    c.push(a.node(a.target(b)).order)
                }), c.sort(function (a, b) {
                    return a - b
                }), d = d.concat(c)
            });
            var e = 1;
            while (e < c.length) e <<= 1;
            var f = 2 * e - 1;
            e -= 1;
            var g = [];
            for (var h = 0; h < f; ++h) g[h] = 0;
            var i = 0;
            return d.forEach(function (a) {
                var b = a + e;
                ++g[b];
                while (b > 0) b % 2 && (i += g[b + 1]), b = b - 1 >> 1, ++g[b]
            }), i
        }
        var d = a("../util");
        b.exports = e
    }, {
        "../util": 17
    }],
    6: [function (a, b, c) {
        function f(a) {
            function c(d) {
                if (d === null) {
                    a.children(d).forEach(function (a) {
                        c(a)
                    });
                    return
                }
                var f = a.node(d);
                f.minRank = "rank" in f ? f.rank : Number.MAX_VALUE, f.maxRank = "rank" in f ? f.rank : Number.MIN_VALUE;
                var h = new e;
                return a.children(d).forEach(function (b) {
                    var d = c(b);
                    h = e.union([h, d]), f.minRank = Math.min(f.minRank, a.node(b).minRank), f.maxRank = Math.max(f.maxRank, a.node(b).maxRank)
                }), "rank" in f && h.add(f.rank), h.keys().forEach(function (a) {
                    a in b || (b[a] = []), b[a].push(d)
                }), h
            }
            var b = [];
            c(null);
            var f = [];
            return b.forEach(function (b, c) {
                f[c] = a.filterNodes(d(b))
            }), f
        }
        var d = a("graphlib").filter.nodesFromList,
            e = a("cp-data").Set;
        b.exports = f
    }, {
        "cp-data": 19,
        graphlib: 24
    }],
    7: [function (a, b, c) {
        function f(a, b) {
            var c = [];
            a.eachNode(function (b, d) {
                var e = c[d.rank];
                if (a.children && a.children(b).length > 0) return;
                e || (e = c[d.rank] = []), e.push(b)
            }), c.forEach(function (c) {
                b && e.shuffle(c), c.forEach(function (b, c) {
                    a.node(b).order = c
                })
            });
            var f = d(a);
            a.graph().orderInitCC = f, a.graph().orderCC = Number.MAX_VALUE
        }
        var d = a("./crossCount"),
            e = a("../util");
        b.exports = f
    }, {
        "../util": 17,
        "./crossCount": 5
    }],
    8: [function (a, b, c) {
        function e(a, b, c) {
            var e = [],
                f = {};
            a.eachNode(function (a, b) {
                e[b.order] = a;
                var g = c[a];
                g.length && (f[a] = d.sum(g) / g.length)
            });
            var g = a.nodes().filter(function (a) {
                return f[a] !== undefined
            });
            g.sort(function (b, c) {
                return f[b] - f[c] || a.node(b).order - a.node(c).order
            });
            for (var h = 0, i = 0, j = g.length; i < j; ++h) f[e[h]] !== undefined && (a.node(g[i++]).order = h)
        }
        var d = a("../util");
        b.exports = e
    }, {
        "../util": 17
    }],
    9: [function (a, b, c) {
        var d = a("./util");
        b.exports = function () {
            function c(b) {
                b = b.filterNodes(d.filterNonSubgraphs(b));
                var c = d.ordering(b),
                    e = f(b, c),
                    i = {};
                ["u", "d"].forEach(function (d) {
                    d === "d" && c.reverse(), ["l", "r"].forEach(function (f) {
                        f === "r" && m(c);
                        var j = d + f,
                            k = g(b, c, e, d === "u" ? "predecessors" : "successors");
                        i[j] = h(b, c, k.pos, k.root, k.align), a.debugLevel >= 3 && t(d + f, b, c, i[j]), f === "r" && l(i[j]), f === "r" && m(c)
                    }), d === "d" && c.reverse()
                }), k(b, c, i), b.eachNode(function (a) {
                    var c = [];
                    for (var d in i) {
                        var e = i[d][a];
                        r(d, b, a, e), c.push(e)
                    }
                    c.sort(function (a, b) {
                        return a - b
                    }), q(b, a, (c[1] + c[2]) / 2)
                });
                var j = 0,
                    p = b.graph().rankDir === "BT" || b.graph().rankDir === "RL";
                c.forEach(function (c) {
                    var e = d.max(c.map(function (a) {
                        return o(b, a)
                    }));
                    j += e / 2, c.forEach(function (a) {
                        s(b, a, p ? -j : j)
                    }), j += e / 2 + a.rankSep
                });
                var u = d.min(b.nodes().map(function (a) {
                        return q(b, a) - n(b, a) / 2
                    })),
                    v = d.min(b.nodes().map(function (a) {
                        return s(b, a) - o(b, a) / 2
                    }));
                b.eachNode(function (a) {
                    q(b, a, q(b, a) - u), s(b, a, s(b, a) - v)
                })
            }

            function e(a, b) {
                return a < b ? a.toString().length + ":" + a + "-" + b : b.toString().length + ":" + b + "-" + a
            }

            function f(a, b) {
                function k(a) {
                    var b = d[a];
                    if (b < h || b > j) c[e(g[i], a)] = !0
                }
                var c = {},
                    d = {},
                    f, g, h, i, j;
                if (b.length <= 2) return c;
                b[1].forEach(function (a, b) {
                    d[a] = b
                });
                for (var l = 1; l < b.length - 1; ++l) {
                    f = b[l], g = b[l + 1], h = 0, i = 0;
                    for (var m = 0; m < g.length; ++m) {
                        var n = g[m];
                        d[n] = m, j = undefined;
                        if (a.node(n).dummy) {
                            var o = a.predecessors(n)[0];
                            o !== undefined && a.node(o).dummy && (j = d[o])
                        }
                        j === undefined && m === g.length - 1 && (j = f.length - 1);
                        if (j !== undefined) {
                            for (; i <= m; ++i) a.predecessors(g[i]).forEach(k);
                            h = j
                        }
                    }
                }
                return c
            }

            function g(a, b, c, d) {
                var f = {},
                    g = {},
                    h = {};
                return b.forEach(function (a) {
                    a.forEach(function (a, b) {
                        g[a] = a, h[a] = a, f[a] = b
                    })
                }), b.forEach(function (b) {
                    var i = -1;
                    b.forEach(function (b) {
                        var j = a[d](b),
                            k;
                        j.length > 0 && (j.sort(function (a, b) {
                            return f[a] - f[b]
                        }), k = (j.length - 1) / 2, j.slice(Math.floor(k), Math.ceil(k) + 1).forEach(function (a) {
                            h[b] === b && !c[e(a, b)] && i < f[a] && (h[a] = b, h[b] = g[b] = g[a], i = f[a])
                        }))
                    })
                }), {
                    pos: f,
                    root: g,
                    align: h
                }
            }

            function h(a, b, c, e, f) {
                function l(a, b, c) {
                    b in h[a] ? h[a][b] = Math.min(h[a][b], c) : h[a][b] = c
                }

                function m(b) {
                    if (!(b in k)) {
                        k[b] = 0;
                        var d = b;
                        do {
                            if (c[d] > 0) {
                                var h = e[j[d]];
                                m(h), g[b] === b && (g[b] = g[h]);
                                var i = p(a, j[d]) + p(a, d);
                                g[b] !== g[h] ? l(g[h], g[b], k[b] - k[h] - i) : k[b] = Math.max(k[b], k[h] + i)
                            }
                            d = f[d]
                        } while (d !== b)
                    }
                }
                var g = {},
                    h = {},
                    i = {},
                    j = {},
                    k = {};
                return b.forEach(function (a) {
                    a.forEach(function (b, c) {
                        g[b] = b, h[b] = {}, c > 0 && (j[b] = a[c - 1])
                    })
                }), d.values(e).forEach(function (a) {
                    m(a)
                }), b.forEach(function (a) {
                    a.forEach(function (a) {
                        k[a] = k[e[a]];
                        if (a === e[a] && a === g[a]) {
                            var b = 0;
                            a in h && Object.keys(h[a]).length > 0 && (b = d.min(Object.keys(h[a]).map(function (b) {
                                return h[a][b] + (b in i ? i[b] : 0)
                            }))), i[a] = b
                        }
                    })
                }), b.forEach(function (a) {
                    a.forEach(function (a) {
                        k[a] += i[g[e[a]]] || 0
                    })
                }), k
            }

            function i(a, b, c) {
                return d.min(b.map(function (a) {
                    var b = a[0];
                    return c[b]
                }))
            }

            function j(a, b, c) {
                return d.max(b.map(function (a) {
                    var b = a[a.length - 1];
                    return c[b]
                }))
            }

            function k(a, b, c) {
                function h(a) {
                    c[l][a] += g[l]
                }
                var d = {},
                    e = {},
                    f, g = {},
                    k = Number.POSITIVE_INFINITY;
                for (var l in c) {
                    var m = c[l];
                    d[l] = i(a, b, m), e[l] = j(a, b, m);
                    var n = e[l] - d[l];
                    n < k && (k = n, f = l)
                } ["u", "d"].forEach(function (a) {
                    ["l", "r"].forEach(function (b) {
                        var c = a + b;
                        g[c] = b === "l" ? d[f] - d[c] : e[f] - e[c]
                    })
                });
                for (l in c) a.eachNode(h)
            }

            function l(a) {
                for (var b in a) a[b] = -a[b]
            }

            function m(a) {
                a.forEach(function (a) {
                    a.reverse()
                })
            }

            function n(a, b) {
                switch (a.graph().rankDir) {
                    case "LR":
                        return a.node(b).height;
                    case "RL":
                        return a.node(b).height;
                    default:
                        return a.node(b).width
                }
            }

            function o(a, b) {
                switch (a.graph().rankDir) {
                    case "LR":
                        return a.node(b).width;
                    case "RL":
                        return a.node(b).width;
                    default:
                        return a.node(b).height
                }
            }

            function p(b, c) {
                if (a.universalSep !== null) return a.universalSep;
                var d = n(b, c),
                    e = b.node(c).dummy ? a.edgeSep : a.nodeSep;
                return (d + e) / 2
            }

            function q(a, b, c) {
                if (a.graph().rankDir === "LR" || a.graph().rankDir === "RL") {
                    if (arguments.length < 3) return a.node(b).y;
                    a.node(b).y = c
                } else {
                    if (arguments.length < 3) return a.node(b).x;
                    a.node(b).x = c
                }
            }

            function r(a, b, c, d) {
                if (b.graph().rankDir === "LR" || b.graph().rankDir === "RL") {
                    if (arguments.length < 3) return b.node(c)[a];
                    b.node(c)[a] = d
                } else {
                    if (arguments.length < 3) return b.node(c)[a];
                    b.node(c)[a] = d
                }
            }

            function s(a, b, c) {
                if (a.graph().rankDir === "LR" || a.graph().rankDir === "RL") {
                    if (arguments.length < 3) return a.node(b).x;
                    a.node(b).x = c
                } else {
                    if (arguments.length < 3) return a.node(b).y;
                    a.node(b).y = c
                }
            }

            function t(a, b, c, d) {
                c.forEach(function (c, e) {
                    var f, g;
                    c.forEach(function (c) {
                        var h = d[c];
                        if (f) {
                            var i = p(b, f) + p(b, c);
                            h - g < i && console.log("Position phase: sep violation. Align: " + a + ". Layer: " + e + ". " + "U: " + f + " V: " + c + ". Actual sep: " + (h - g) + " Expected sep: " + i)
                        }
                        f = c, g = h
                    })
                })
            }
            var a = {
                    nodeSep: 50,
                    edgeSep: 10,
                    universalSep: null,
                    rankSep: 30
                },
                b = {};
            return b.nodeSep = d.propertyAccessor(b, a, "nodeSep"), b.edgeSep = d.propertyAccessor(b, a, "edgeSep"), b.universalSep = d.propertyAccessor(b, a, "universalSep"), b.rankSep = d.propertyAccessor(b, a, "rankSep"), b.debugLevel = d.propertyAccessor(b, a, "debugLevel"), b.run = c, b
        }
    }, {
        "./util": 17
    }],
    10: [function (a, b, c) {
        function l(a, b) {
            n(a), d.time("constraints.apply", h.apply)(a), o(a), d.time("acyclic", e)(a);
            var c = a.filterNodes(d.filterNonSubgraphs(a));
            f(c), j(c).forEach(function (a) {
                var d = c.filterNodes(k.nodesFromList(a));
                r(d, b)
            }), d.time("constraints.relax", h.relax(a)), d.time("reorientEdges", q)(a)
        }

        function m(a) {
            e.undo(a)
        }

        function n(a) {
            a.eachEdge(function (b, c, d, e) {
                if (c === d) {
                    var f = p(a, b, c, d, e, 0, !1),
                        g = p(a, b, c, d, e, 1, !0),
                        h = p(a, b, c, d, e, 2, !1);
                    a.addEdge(null, f, c, {
                        minLen: 1,
                        selfLoop: !0
                    }), a.addEdge(null, f, g, {
                        minLen: 1,
                        selfLoop: !0
                    }), a.addEdge(null, c, h, {
                        minLen: 1,
                        selfLoop: !0
                    }), a.addEdge(null, g, h, {
                        minLen: 1,
                        selfLoop: !0
                    }), a.delEdge(b)
                }
            })
        }

        function o(a) {
            a.eachEdge(function (b, c, d, e) {
                if (c === d) {
                    var f = e.originalEdge,
                        g = p(a, f.e, f.u, f.v, f.value, 0, !0);
                    a.addEdge(null, c, g, {
                        minLen: 1
                    }), a.addEdge(null, g, d, {
                        minLen: 1
                    }), a.delEdge(b)
                }
            })
        }

        function p(a, b, c, d, e, f, g) {
            return a.addNode(null, {
                width: g ? e.width : 0,
                height: g ? e.height : 0,
                edge: {
                    id: b,
                    source: c,
                    target: d,
                    attrs: e
                },
                dummy: !0,
                index: f
            })
        }

        function q(a) {
            a.eachEdge(function (b, c, d, e) {
                a.node(c).rank > a.node(d).rank && (a.delEdge(b), e.reversed = !0, a.addEdge(b, d, c, e))
            })
        }

        function r(a, b) {
            var c = g(a);
            b && (d.log(1, "Using network simplex for ranking"), i(a, c)), s(a)
        }

        function s(a) {
            var b = d.min(a.nodes().map(function (b) {
                return a.node(b).rank
            }));
            a.eachNode(function (a, c) {
                c.rank -= b
            })
        }
        var d = a("./util"),
            e = a("./rank/acyclic"),
            f = a("./rank/initRank"),
            g = a("./rank/feasibleTree"),
            h = a("./rank/constraints"),
            i = a("./rank/simplex"),
            j = a("graphlib").alg.components,
            k = a("graphlib").filter;
        c.run = l, c.restoreEdges = m
    }, {
        "./rank/acyclic": 11,
        "./rank/constraints": 12,
        "./rank/feasibleTree": 13,
        "./rank/initRank": 14,
        "./rank/simplex": 16,
        "./util": 17,
        graphlib: 24
    }],
    11: [function (a, b, c) {
        function e(a) {
            function f(d) {
                if (d in c) return;
                c[d] = b[d] = !0, a.outEdges(d).forEach(function (c) {
                    var h = a.target(c),
                        i;
                    d === h ? console.error('Warning: found self loop "' + c + '" for node "' + d + '"') : h in b ? (i = a.edge(c), a.delEdge(c), i.reversed = !0, ++e, a.addEdge(c, h, d, i)) : f(h)
                }), delete b[d]
            }
            var b = {},
                c = {},
                e = 0;
            return a.eachNode(function (a) {
                f(a)
            }), d.log(2, "Acyclic Phase: reversed " + e + " edge(s)"), e
        }

        function f(a) {
            a.eachEdge(function (b, c, d, e) {
                e.reversed && (delete e.reversed, a.delEdge(b), a.addEdge(b, d, c, e))
            })
        }
        var d = a("../util");
        b.exports = e, b.exports.undo = f
    }, {
        "../util": 17
    }],
    12: [function (a, b, c) {
        function d(a) {
            return a !== "min" && a !== "max" && a.indexOf("same_") !== 0 ? (console.error("Unsupported rank type: " + a), !1) : !0
        }

        function e(a, b, c, d) {
            a.inEdges(b).forEach(function (b) {
                var e = a.edge(b),
                    f;
                e.originalEdge ? f = e : f = {
                    originalEdge: {
                        e: b,
                        u: a.source(b),
                        v: a.target(b),
                        value: e
                    },
                    minLen: a.edge(b).minLen
                }, e.selfLoop && (d = !1), d ? (a.addEdge(null, c, a.source(b), f), f.reversed = !0) : a.addEdge(null, a.source(b), c, f)
            })
        }

        function f(a, b, c, d) {
            a.outEdges(b).forEach(function (b) {
                var e = a.edge(b),
                    f;
                e.originalEdge ? f = e : f = {
                    originalEdge: {
                        e: b,
                        u: a.source(b),
                        v: a.target(b),
                        value: e
                    },
                    minLen: a.edge(b).minLen
                }, e.selfLoop && (d = !1), d ? (a.addEdge(null, a.target(b), c, f), f.reversed = !0) : a.addEdge(null, c, a.target(b), f)
            })
        }

        function g(a, b, c) {
            c !== undefined && a.children(b).forEach(function (b) {
                b !== c && !a.outEdges(c, b).length && !a.node(b).dummy && a.addEdge(null, c, b, {
                    minLen: 0
                })
            })
        }

        function h(a, b, c) {
            c !== undefined && a.children(b).forEach(function (b) {
                b !== c && !a.outEdges(b, c).length && !a.node(b).dummy && a.addEdge(null, b, c, {
                    minLen: 0
                })
            })
        }
        c.apply = function (a) {
            function b(c) {
                var i = {};
                a.children(c).forEach(function (g) {
                    if (a.children(g).length) {
                        b(g);
                        return
                    }
                    var h = a.node(g),
                        j = h.prefRank;
                    if (j !== undefined) {
                        if (!d(j)) return;
                        j in i ? i.prefRank.push(g) : i.prefRank = [g];
                        var k = i[j];
                        k === undefined && (k = i[j] = a.addNode(null, {
                            originalNodes: []
                        }), a.parent(k, c)), e(a, g, k, j === "min"), f(a, g, k, j === "max"), a.node(k).originalNodes.push({
                            u: g,
                            value: h,
                            parent: c
                        }), a.delNode(g)
                    }
                }), g(a, c, i.min), h(a, c, i.max)
            }
            b(null)
        }, c.relax = function (a) {
            var b = [];
            a.eachEdge(function (a, c, d, e) {
                var f = e.originalEdge;
                f && b.push(f)
            }), a.eachNode(function (b, c) {
                var d = c.originalNodes;
                d && (d.forEach(function (b) {
                    b.value.rank = c.rank, a.addNode(b.u, b.value), a.parent(b.u, b.parent)
                }), a.delNode(b))
            }), b.forEach(function (b) {
                a.addEdge(b.e, b.u, b.v, b.value)
            })
        }
    }, {}],
    13: [function (a, b, c) {
        function g(a) {
            function g(d) {
                var e = !0;
                return a.predecessors(d).forEach(function (f) {
                    b.has(f) && !h(a, f, d) && (b.has(d) && (c.addNode(d, {}), b.remove(d), c.graph({
                        root: d
                    })), c.addNode(f, {}), c.addEdge(null, f, d, {
                        reversed: !0
                    }), b.remove(f), g(f), e = !1)
                }), a.successors(d).forEach(function (f) {
                    b.has(f) && !h(a, d, f) && (b.has(d) && (c.addNode(d, {}), b.remove(d), c.graph({
                        root: d
                    })), c.addNode(f, {}), c.addEdge(null, d, f, {}), b.remove(f), g(f), e = !1)
                }), e
            }

            function i() {
                var d = Number.MAX_VALUE;
                b.keys().forEach(function (c) {
                    a.predecessors(c).forEach(function (e) {
                        if (!b.has(e)) {
                            var f = h(a, e, c);
                            Math.abs(f) < Math.abs(d) && (d = -f)
                        }
                    }), a.successors(c).forEach(function (e) {
                        if (!b.has(e)) {
                            var f = h(a, c, e);
                            Math.abs(f) < Math.abs(d) && (d = f)
                        }
                    })
                }), c.eachNode(function (b) {
                    a.node(b).rank -= d
                })
            }
            var b = new d(a.nodes()),
                c = new e;
            if (b.size() === 1) {
                var f = a.nodes()[0];
                return c.addNode(f, {}), c.graph({
                    root: f
                }), c
            }
            while (b.size()) {
                var j = c.order() ? c.nodes() : b.keys();
                for (var k = 0, l = j.length; k < l && g(j[k]); ++k);
                b.size() && i()
            }
            return c
        }

        function h(a, b, c) {
            var d = a.node(c).rank - a.node(b).rank,
                e = f.max(a.outEdges(b, c).map(function (b) {
                    return a.edge(b).minLen
                }));
            return d - e
        }
        var d = a("cp-data").Set,
            e = a("graphlib").Digraph,
            f = a("../util");
        b.exports = g
    }, {
        "../util": 17,
        "cp-data": 19,
        graphlib: 24
    }],
    14: [function (a, b, c) {
        function f(a) {
            var b = e(a);
            b.forEach(function (b) {
                var c = a.inEdges(b);
                if (c.length === 0) {
                    a.node(b).rank = 0;
                    return
                }
                var e = c.map(function (b) {
                    return a.node(a.source(b)).rank + a.edge(b).minLen
                });
                a.node(b).rank = d.max(e)
            })
        }
        var d = a("../util"),
            e = a("graphlib").alg.topsort;
        b.exports = f
    }, {
        "../util": 17,
        graphlib: 24
    }],
    15: [function (a, b, c) {
        function d(a, b, c, d) {
            return Math.abs(a.node(b).rank - a.node(c).rank) - d
        }
        b.exports = {
            slack: d
        }
    }, {}],
    16: [function (a, b, c) {
        function f(a, b) {
            g(a, b);
            for (;;) {
                var c = k(b);
                if (c === null) break;
                var d = l(a, b, c);
                m(a, b, c, d)
            }
        }

        function g(a, b) {
            function c(d) {
                var e = b.successors(d);
                for (var f in e) {
                    var g = e[f];
                    c(g)
                }
                d !== b.graph().root && i(a, b, d)
            }
            h(b), b.eachEdge(function (a, b, c, d) {
                d.cutValue = 0
            }), c(b.graph().root)
        }

        function h(a) {
            function c(d) {
                var e = a.successors(d),
                    f = b;
                for (var g in e) {
                    var h = e[g];
                    c(h), f = Math.min(f, a.node(h).low)
                }
                a.node(d).low = f, a.node(d).lim = b++
            }
            var b = 0;
            c(a.graph().root)
        }

        function i(a, b, c) {
            var d = b.inEdges(c)[0],
                e = [],
                f = b.outEdges(c);
            for (var g in f) e.push(b.target(f[g]));
            var h = 0,
                i = 0,
                k = 0,
                l = 0,
                m = 0,
                n = a.outEdges(c),
                o;
            for (var p in n) {
                var q = a.target(n[p]);
                for (o in e) j(b, q, e[o]) && i++;
                j(b, q, c) || l++
            }
            var r = a.inEdges(c);
            for (var s in r) {
                var t = a.source(r[s]);
                for (o in e) j(b, t, e[o]) && k++;
                j(b, t, c) || m++
            }
            var u = 0;
            for (o in e) {
                var v = b.edge(f[o]).cutValue;
                b.edge(f[o]).reversed ? u -= v : u += v
            }
            b.edge(d).reversed ? h -= u - i + k - l + m : h += u - i + k - l + m, b.edge(d).cutValue = h
        }

        function j(a, b, c) {
            return a.node(c).low <= a.node(b).lim && a.node(b).lim <= a.node(c).lim
        }

        function k(a) {
            var b = a.edges();
            for (var c in b) {
                var d = b[c],
                    e = a.edge(d);
                if (e.cutValue < 0) return d
            }
            return null
        }

        function l(a, b, c) {
            var d = b.source(c),
                f = b.target(c),
                g = b.node(f).lim < b.node(d).lim ? f : d,
                h = !b.edge(c).reversed,
                i = Number.POSITIVE_INFINITY,
                k;
            h ? a.eachEdge(function (d, f, h, l) {
                if (d !== c && j(b, f, g) && !j(b, h, g)) {
                    var m = e.slack(a, f, h, l.minLen);
                    m < i && (i = m, k = d)
                }
            }) : a.eachEdge(function (d, f, h, l) {
                if (d !== c && !j(b, f, g) && j(b, h, g)) {
                    var m = e.slack(a, f, h, l.minLen);
                    m < i && (i = m, k = d)
                }
            });
            if (k === undefined) {
                var l = [],
                    m = [];
                throw a.eachNode(function (a) {
                    j(b, a, g) ? m.push(a) : l.push(a)
                }), new Error("No edge found from outside of tree to inside")
            }
            return k
        }

        function m(a, b, c, d) {
            function h(a) {
                var c = b.inEdges(a);
                for (var d in c) {
                    var e = c[d],
                        f = b.source(e),
                        g = b.edge(e);
                    h(f), b.delEdge(e), g.reversed = !g.reversed, b.addEdge(e, a, f, g)
                }
            }
            b.delEdge(c);
            var e = a.source(d),
                f = a.target(d);
            h(f);
            var i = e,
                j = b.inEdges(i);
            while (j.length > 0) i = b.source(j[0]), j = b.inEdges(i);
            b.graph().root = i, b.addEdge(null, e, f, {
                cutValue: 0
            }), g(a, b), n(a, b)
        }

        function n(a, b) {
            function c(d) {
                var e = b.successors(d);
                e.forEach(function (b) {
                    var e = o(a, d, b);
                    a.node(b).rank = a.node(d).rank + e, c(b)
                })
            }
            c(b.graph().root)
        }

        function o(a, b, c) {
            var e = a.outEdges(b, c);
            if (e.length > 0) return d.max(e.map(function (b) {
                return a.edge(b).minLen
            }));
            var f = a.inEdges(b, c);
            if (f.length > 0) return -d.max(f.map(function (b) {
                return a.edge(b).minLen
            }))
        }
        var d = a("../util"),
            e = a("./rankUtil");
        b.exports = f
    }, {
        "../util": 17,
        "./rankUtil": 15
    }],
    17: [function (a, b, c) {
        function d(a, b) {
            return function () {
                var c = (new Date).getTime();
                try {
                    return b.apply(null, arguments)
                } finally {
                    e(1, a + " time: " + ((new Date).getTime() - c) + "ms")
                }
            }
        }

        function e(a) {
            e.level >= a && console.log.apply(console, Array.prototype.slice.call(arguments, 1))
        }
        c.min = function (a) {
            return Math.min.apply(Math, a)
        }, c.max = function (a) {
            return Math.max.apply(Math, a)
        }, c.all = function (a, b) {
            for (var c = 0; c < a.length; ++c)
                if (!b(a[c])) return !1;
            return !0
        }, c.sum = function (a) {
            return a.reduce(function (a, b) {
                return a + b
            }, 0)
        }, c.values = function (a) {
            return Object.keys(a).map(function (b) {
                return a[b]
            })
        }, c.shuffle = function (a) {
            for (i = a.length - 1; i > 0; --i) {
                var b = Math.floor(Math.random() * (i + 1)),
                    c = a[b];
                a[b] = a[i], a[i] = c
            }
        }, c.propertyAccessor = function (a, b, c, d) {
            return function (e) {
                return arguments.length ? (b[c] = e, d && d(e), a) : b[c]
            }
        }, c.ordering = function (a) {
            var b = [];
            return a.eachNode(function (a, c) {
                var d = b[c.rank] || (b[c.rank] = []);
                d[c.order] = a
            }), b
        }, c.filterNonSubgraphs = function (a) {
            return function (b) {
                return a.children(b).length === 0
            }
        }, d.enabled = !1, c.time = d, e.level = 0, c.log = e
    }, {}],
    18: [function (a, b, c) {
        b.exports = "0.4.5"
    }, {}],
    19: [function (a, b, c) {
        c.Set = a("./lib/Set"), c.PriorityQueue = a("./lib/PriorityQueue"), c.version = a("./lib/version")
    }, {
        "./lib/PriorityQueue": 20,
        "./lib/Set": 21,
        "./lib/version": 23
    }],
    20: [function (a, b, c) {
        function d() {
            this._arr = [], this._keyIndices = {}
        }
        b.exports = d, d.prototype.size = function () {
            return this._arr.length
        }, d.prototype.keys = function () {
            return this._arr.map(function (a) {
                return a.key
            })
        }, d.prototype.has = function (a) {
            return a in this._keyIndices
        }, d.prototype.priority = function (a) {
            var b = this._keyIndices[a];
            if (b !== undefined) return this._arr[b].priority
        }, d.prototype.min = function () {
            if (this.size() === 0) throw new Error("Queue underflow");
            return this._arr[0].key
        }, d.prototype.add = function (a, b) {
            var c = this._keyIndices;
            if (a in c) return !1;
            var d = this._arr,
                e = d.length;
            return c[a] = e, d.push({
                key: a,
                priority: b
            }), this._decrease(e), !0
        }, d.prototype.removeMin = function () {
            this._swap(0, this._arr.length - 1);
            var a = this._arr.pop();
            return delete this._keyIndices[a.key], this._heapify(0), a.key
        }, d.prototype.decrease = function (a, b) {
            var c = this._keyIndices[a];
            if (b > this._arr[c].priority) throw new Error("New priority is greater than current priority. Key: " + a + " Old: " + this._arr[c].priority + " New: " + b);
            this._arr[c].priority = b, this._decrease(c)
        }, d.prototype._heapify = function (a) {
            var b = this._arr,
                c = 2 * a,
                d = c + 1,
                e = a;
            c < b.length && (e = b[c].priority < b[e].priority ? c : e, d < b.length && (e = b[d].priority < b[e].priority ? d : e), e !== a && (this._swap(a, e), this._heapify(e)))
        }, d.prototype._decrease = function (a) {
            var b = this._arr,
                c = b[a].priority,
                d;
            while (a !== 0) {
                d = a >> 1;
                if (b[d].priority < c) break;
                this._swap(a, d), a = d
            }
        }, d.prototype._swap = function (a, b) {
            var c = this._arr,
                d = this._keyIndices,
                e = c[a],
                f = c[b];
            c[a] = f, c[b] = e, d[f.key] = a, d[e.key] = b
        }
    }, {}],
    21: [function (a, b, c) {
        function e(a) {
            this._size = 0, this._keys = {};
            if (a)
                for (var b = 0, c = a.length; b < c; ++b) this.add(a[b])
        }

        function f(a) {
            var b = Object.keys(a),
                c = b.length,
                d = new Array(c),
                e;
            for (e = 0; e < c; ++e) d[e] = a[b[e]];
            return d
        }
        var d = a("./util");
        b.exports = e, e.intersect = function (a) {
            if (a.length === 0) return new e;
            var b = new e(d.isArray(a[0]) ? a[0] : a[0].keys());
            for (var c = 1, f = a.length; c < f; ++c) {
                var g = b.keys(),
                    h = d.isArray(a[c]) ? new e(a[c]) : a[c];
                for (var i = 0, j = g.length; i < j; ++i) {
                    var k = g[i];
                    h.has(k) || b.remove(k)
                }
            }
            return b
        }, e.union = function (a) {
            var b = d.reduce(a, function (a, b) {
                    return a + (b.size ? b.size() : b.length)
                }, 0),
                c = new Array(b),
                f = 0;
            for (var g = 0, h = a.length; g < h; ++g) {
                var i = a[g],
                    j = d.isArray(i) ? i : i.keys();
                for (var k = 0, l = j.length; k < l; ++k) c[f++] = j[k]
            }
            return new e(c)
        }, e.prototype.size = function () {
            return this._size
        }, e.prototype.keys = function () {
            return f(this._keys)
        }, e.prototype.has = function (a) {
            return a in this._keys
        }, e.prototype.add = function (a) {
            return a in this._keys ? !1 : (this._keys[a] = a, ++this._size, !0)
        }, e.prototype.remove = function (a) {
            return a in this._keys ? (delete this._keys[a], --this._size, !0) : !1
        }
    }, {
        "./util": 22
    }],
    22: [function (a, b, c) {
        Array.isArray ? c.isArray = Array.isArray : c.isArray = function (a) {
            return Object.prototype.toString.call(a) === "[object Array]"
        }, "function" != typeof Array.prototype.reduce ? c.reduce = function (a, b, c) {
            "use strict";
            if (null === a || "undefined" == typeof a) throw new TypeError("Array.prototype.reduce called on null or undefined");
            if ("function" != typeof b) throw new TypeError(b + " is not a function");
            var d, e, f = a.length >>> 0,
                g = !1;
            1 < arguments.length && (e = c, g = !0);
            for (d = 0; f > d; ++d) a.hasOwnProperty(d) && (g ? e = b(e, a[d], d, a) : (e = a[d], g = !0));
            if (!g) throw new TypeError("Reduce of empty array with no initial value");
            return e
        } : c.reduce = function (a, b, c) {
            return a.reduce(b, c)
        }
    }, {}],
    23: [function (a, b, c) {
        b.exports = "1.1.3"
    }, {}],
    24: [function (a, b, c) {
        c.Graph = a("./lib/Graph"), c.Digraph = a("./lib/Digraph"), c.CGraph = a("./lib/CGraph"), c.CDigraph = a("./lib/CDigraph"), a("./lib/graph-converters"), c.alg = {
            isAcyclic: a("./lib/alg/isAcyclic"),
            components: a("./lib/alg/components"),
            dijkstra: a("./lib/alg/dijkstra"),
            dijkstraAll: a("./lib/alg/dijkstraAll"),
            findCycles: a("./lib/alg/findCycles"),
            floydWarshall: a("./lib/alg/floydWarshall"),
            postorder: a("./lib/alg/postorder"),
            preorder: a("./lib/alg/preorder"),
            prim: a("./lib/alg/prim"),
            tarjan: a("./lib/alg/tarjan"),
            topsort: a("./lib/alg/topsort")
        }, c.converter = {
            json: a("./lib/converter/json.js")
        };
        var d = a("./lib/filter");
        c.filter = {
            all: d.all,
            nodesFromList: d.nodesFromList
        }, c.version = a("./lib/version")
    }, {
        "./lib/CDigraph": 26,
        "./lib/CGraph": 27,
        "./lib/Digraph": 28,
        "./lib/Graph": 29,
        "./lib/alg/components": 30,
        "./lib/alg/dijkstra": 31,
        "./lib/alg/dijkstraAll": 32,
        "./lib/alg/findCycles": 33,
        "./lib/alg/floydWarshall": 34,
        "./lib/alg/isAcyclic": 35,
        "./lib/alg/postorder": 36,
        "./lib/alg/preorder": 37,
        "./lib/alg/prim": 38,
        "./lib/alg/tarjan": 39,
        "./lib/alg/topsort": 40,
        "./lib/converter/json.js": 42,
        "./lib/filter": 43,
        "./lib/graph-converters": 44,
        "./lib/version": 46
    }],
    25: [function (a, b, c) {
        function e() {
            this._value = undefined, this._nodes = {}, this._edges = {}, this._nextId = 0
        }

        function f(a, b, c) {
            (a[b] || (a[b] = new d)).add(c)
        }

        function g(a, b, c) {
            var d = a[b];
            d.remove(c), d.size() === 0 && delete a[b]
        }
        var d = a("cp-data").Set;
        b.exports = e, e.prototype.order = function () {
            return Object.keys(this._nodes).length
        }, e.prototype.size = function () {
            return Object.keys(this._edges).length
        }, e.prototype.graph = function (a) {
            if (arguments.length === 0) return this._value;
            this._value = a
        }, e.prototype.hasNode = function (a) {
            return a in this._nodes
        }, e.prototype.node = function (a, b) {
            var c = this._strictGetNode(a);
            if (arguments.length === 1) return c.value;
            c.value = b
        }, e.prototype.nodes = function () {
            var a = [];
            return this.eachNode(function (b) {
                a.push(b)
            }), a
        }, e.prototype.eachNode = function (a) {
            for (var b in this._nodes) {
                var c = this._nodes[b];
                a(c.id, c.value)
            }
        }, e.prototype.hasEdge = function (a) {
            return a in this._edges
        }, e.prototype.edge = function (a, b) {
            var c = this._strictGetEdge(a);
            if (arguments.length === 1) return c.value;
            c.value = b
        }, e.prototype.edges = function () {
            var a = [];
            return this.eachEdge(function (b) {
                a.push(b)
            }), a
        }, e.prototype.eachEdge = function (a) {
            for (var b in this._edges) {
                var c = this._edges[b];
                a(c.id, c.u, c.v, c.value)
            }
        }, e.prototype.incidentNodes = function (a) {
            var b = this._strictGetEdge(a);
            return [b.u, b.v]
        }, e.prototype.addNode = function (a, b) {
            if (a === undefined || a === null) {
                do a = "_" + ++this._nextId; while (this.hasNode(a))
            } else if (this.hasNode(a)) throw new Error("Graph already has node '" + a + "'");
            return this._nodes[a] = {
                id: a,
                value: b
            }, a
        }, e.prototype.delNode = function (a) {
            this._strictGetNode(a), this.incidentEdges(a).forEach(function (a) {
                this.delEdge(a)
            }, this), delete this._nodes[a]
        }, e.prototype._addEdge = function (a, b, c, d, e, g) {
            this._strictGetNode(b), this._strictGetNode(c);
            if (a === undefined || a === null) {
                do a = "_" + ++this._nextId; while (this.hasEdge(a))
            } else if (this.hasEdge(a)) throw new Error("Graph already has edge '" + a + "'");
            return this._edges[a] = {
                id: a,
                u: b,
                v: c,
                value: d
            }, f(e[c], b, a), f(g[b], c, a), a
        }, e.prototype._delEdge = function (a, b, c) {
            var d = this._strictGetEdge(a);
            g(b[d.v], d.u, a), g(c[d.u], d.v, a), delete this._edges[a]
        }, e.prototype.copy = function () {
            var a = new this.constructor;
            return a.graph(this.graph()), this.eachNode(function (b, c) {
                a.addNode(b, c)
            }), this.eachEdge(function (b, c, d, e) {
                a.addEdge(b, c, d, e)
            }), a._nextId = this._nextId, a
        }, e.prototype.filterNodes = function (a) {
            var b = new this.constructor;
            return b.graph(this.graph()), this.eachNode(function (c, d) {
                a(c) && b.addNode(c, d)
            }), this.eachEdge(function (a, c, d, e) {
                b.hasNode(c) && b.hasNode(d) && b.addEdge(a, c, d, e)
            }), b
        }, e.prototype._strictGetNode = function (a) {
            var b = this._nodes[a];
            if (b === undefined) throw new Error("Node '" + a + "' is not in graph");
            return b
        }, e.prototype._strictGetEdge = function (a) {
            var b = this._edges[a];
            if (b === undefined) throw new Error("Edge '" + a + "' is not in graph");
            return b
        }
    }, {
        "cp-data": 19
    }],
    26: [function (a, b, c) {
        var d = a("./Digraph"),
            e = a("./compoundify"),
            f = e(d);
        b.exports = f, f.fromDigraph = function (a) {
            var b = new f,
                c = a.graph();
            return c !== undefined && b.graph(c), a.eachNode(function (a, c) {
                c === undefined ? b.addNode(a) : b.addNode(a, c)
            }), a.eachEdge(function (a, c, d, e) {
                e === undefined ? b.addEdge(null, c, d) : b.addEdge(null, c, d, e)
            }), b
        }, f.prototype.toString = function () {
            return "CDigraph " + JSON.stringify(this, null, 2)
        }
    }, {
        "./Digraph": 28,
        "./compoundify": 41
    }],
    27: [function (a, b, c) {
        var d = a("./Graph"),
            e = a("./compoundify"),
            f = e(d);
        b.exports = f, f.fromGraph = function (a) {
            var b = new f,
                c = a.graph();
            return c !== undefined && b.graph(c), a.eachNode(function (a, c) {
                c === undefined ? b.addNode(a) : b.addNode(a, c)
            }), a.eachEdge(function (a, c, d, e) {
                e === undefined ? b.addEdge(null, c, d) : b.addEdge(null, c, d, e)
            }), b
        }, f.prototype.toString = function () {
            return "CGraph " + JSON.stringify(this, null, 2)
        }
    }, {
        "./Graph": 29,
        "./compoundify": 41
    }],
    28: [function (a, b, c) {
        function g() {
            e.call(this), this._inEdges = {}, this._outEdges = {}
        }
        var d = a("./util"),
            e = a("./BaseGraph"),
            f = a("cp-data").Set;
        b.exports = g, g.prototype = new e, g.prototype.constructor = g, g.prototype.isDirected = function () {
            return !0
        }, g.prototype.successors = function (a) {
            return this._strictGetNode(a), Object.keys(this._outEdges[a]).map(function (a) {
                return this._nodes[a].id
            }, this)
        }, g.prototype.predecessors = function (a) {
            return this._strictGetNode(a), Object.keys(this._inEdges[a]).map(function (a) {
                return this._nodes[a].id
            }, this)
        }, g.prototype.neighbors = function (a) {
            return f.union([this.successors(a), this.predecessors(a)]).keys()
        }, g.prototype.sources = function () {
            var a = this;
            return this._filterNodes(function (b) {
                return a.inEdges(b).length === 0
            })
        }, g.prototype.sinks = function () {
            var a = this;
            return this._filterNodes(function (b) {
                return a.outEdges(b).length === 0
            })
        }, g.prototype.source = function (a) {
            return this._strictGetEdge(a).u
        }, g.prototype.target = function (a) {
            return this._strictGetEdge(a).v
        }, g.prototype.inEdges = function (a, b) {
            this._strictGetNode(a);
            var c = f.union(d.values(this._inEdges[a])).keys();
            return arguments.length > 1 && (this._strictGetNode(b), c = c.filter(function (a) {
                return this.source(a) === b
            }, this)), c
        }, g.prototype.outEdges = function (a, b) {
            this._strictGetNode(a);
            var c = f.union(d.values(this._outEdges[a])).keys();
            return arguments.length > 1 && (this._strictGetNode(b), c = c.filter(function (a) {
                return this.target(a) === b
            }, this)), c
        }, g.prototype.incidentEdges = function (a, b) {
            return arguments.length > 1 ? f.union([this.outEdges(a, b), this.outEdges(b, a)]).keys() : f.union([this.inEdges(a), this.outEdges(a)]).keys()
        }, g.prototype.toString = function () {
            return "Digraph " + JSON.stringify(this, null, 2)
        }, g.prototype.addNode = function (a, b) {
            return a = e.prototype.addNode.call(this, a, b), this._inEdges[a] = {}, this._outEdges[a] = {}, a
        }, g.prototype.delNode = function (a) {
            e.prototype.delNode.call(this, a), delete this._inEdges[a], delete this._outEdges[a]
        }, g.prototype.addEdge = function (a, b, c, d) {
            return e.prototype._addEdge.call(this, a, b, c, d, this._inEdges, this._outEdges)
        }, g.prototype.delEdge = function (a) {
            e.prototype._delEdge.call(this, a, this._inEdges, this._outEdges)
        }, g.prototype._filterNodes = function (a) {
            var b = [];
            return this.eachNode(function (c) {
                a(c) && b.push(c)
            }), b
        }
    }, {
        "./BaseGraph": 25,
        "./util": 45,
        "cp-data": 19
    }],
    29: [function (a, b, c) {
        function g() {
            e.call(this), this._incidentEdges = {}
        }
        var d = a("./util"),
            e = a("./BaseGraph"),
            f = a("cp-data").Set;
        b.exports = g, g.prototype = new e, g.prototype.constructor = g, g.prototype.isDirected = function () {
            return !1
        }, g.prototype.neighbors = function (a) {
            return this._strictGetNode(a), Object.keys(this._incidentEdges[a]).map(function (a) {
                return this._nodes[a].id
            }, this)
        }, g.prototype.incidentEdges = function (a, b) {
            return this._strictGetNode(a), arguments.length > 1 ? (this._strictGetNode(b), b in this._incidentEdges[a] ? this._incidentEdges[a][b].keys() : []) : f.union(d.values(this._incidentEdges[a])).keys()
        }, g.prototype.toString = function () {
            return "Graph " + JSON.stringify(this, null, 2)
        }, g.prototype.addNode = function (a, b) {
            return a = e.prototype.addNode.call(this, a, b), this._incidentEdges[a] = {}, a
        }, g.prototype.delNode = function (a) {
            e.prototype.delNode.call(this, a), delete this._incidentEdges[a]
        }, g.prototype.addEdge = function (a, b, c, d) {
            return e.prototype._addEdge.call(this, a, b, c, d, this._incidentEdges, this._incidentEdges)
        }, g.prototype.delEdge = function (a) {
            e.prototype._delEdge.call(this, a, this._incidentEdges, this._incidentEdges)
        }
    }, {
        "./BaseGraph": 25,
        "./util": 45,
        "cp-data": 19
    }],
    30: [function (a, b, c) {
        function e(a) {
            function e(b, d) {
                c.has(b) || (c.add(b), d.push(b), a.neighbors(b).forEach(function (a) {
                    e(a, d)
                }))
            }
            var b = [],
                c = new d;
            return a.nodes().forEach(function (a) {
                var c = [];
                e(a, c), c.length > 0 && b.push(c)
            }), b
        }
        var d = a("cp-data").Set;
        b.exports = e
    }, {
        "cp-data": 19
    }],
    31: [function (a, b, c) {
        function e(a, b, c, e) {
            function h(b) {
                var d = a.incidentNodes(b),
                    e = d[0] !== i ? d[0] : d[1],
                    h = f[e],
                    k = c(b),
                    l = j.distance + k;
                if (k < 0) throw new Error("dijkstra does not allow negative edge weights. Bad edge: " + b + " Weight: " + k);
                l < h.distance && (h.distance = l, h.predecessor = i, g.decrease(e, l))
            }
            var f = {},
                g = new d;
            c = c || function () {
                return 1
            }, e = e || (a.isDirected() ? function (b) {
                return a.outEdges(b)
            } : function (b) {
                return a.incidentEdges(b)
            }), a.eachNode(function (a) {
                var c = a === b ? 0 : Number.POSITIVE_INFINITY;
                f[a] = {
                    distance: c
                }, g.add(a, c)
            });
            var i, j;
            while (g.size() > 0) {
                i = g.removeMin(), j = f[i];
                if (j.distance === Number.POSITIVE_INFINITY) break;
                e(i).forEach(h)
            }
            return f
        }
        var d = a("cp-data").PriorityQueue;
        b.exports = e
    }, {
        "cp-data": 19
    }],
    32: [function (a, b, c) {
        function e(a, b, c) {
            var e = {};
            return a.eachNode(function (f) {
                e[f] = d(a, f, b, c)
            }), e
        }
        var d = a("./dijkstra");
        b.exports = e
    }, {
        "./dijkstra": 31
    }],
    33: [function (a, b, c) {
        function e(a) {
            return d(a).filter(function (a) {
                return a.length > 1
            })
        }
        var d = a("./tarjan");
        b.exports = e
    }, {
        "./tarjan": 39
    }],
    34: [function (a, b, c) {
        function d(a, b, c) {
            var d = {},
                e = a.nodes();
            return b = b || function () {
                return 1
            }, c = c || (a.isDirected() ? function (b) {
                return a.outEdges(b)
            } : function (b) {
                return a.incidentEdges(b)
            }), e.forEach(function (f) {
                d[f] = {}, d[f][f] = {
                    distance: 0
                }, e.forEach(function (a) {
                    f !== a && (d[f][a] = {
                        distance: Number.POSITIVE_INFINITY
                    })
                }), c(f).forEach(function (c) {
                    var e = a.incidentNodes(c),
                        h = e[0] !== f ? e[0] : e[1],
                        i = b(c);
                    i < d[f][h].distance && (d[f][h] = {
                        distance: i,
                        predecessor: f
                    })
                })
            }), e.forEach(function (a) {
                var b = d[a];
                e.forEach(function (c) {
                    var f = d[c];
                    e.forEach(function (c) {
                        var d = f[a],
                            e = b[c],
                            g = f[c],
                            h = d.distance + e.distance;
                        h < g.distance && (g.distance = h, g.predecessor = e.predecessor)
                    })
                })
            }), d
        }
        b.exports = d
    }, {}],
    35: [function (a, b, c) {
        function e(a) {
            try {
                d(a)
            } catch (b) {
                if (b instanceof d.CycleException) return !1;
                throw b
            }
            return !0
        }
        var d = a("./topsort");
        b.exports = e
    }, {
        "./topsort": 40
    }],
    36: [function (a, b, c) {
        function e(a, b, c) {
            function f(b, d) {
                if (e.has(b)) throw new Error("The input graph is not a tree: " + a);
                e.add(b), a.neighbors(b).forEach(function (a) {
                    a !== d && f(a, b)
                }), c(b)
            }
            var e = new d;
            if (a.isDirected()) throw new Error("This function only works for undirected graphs");
            f(b)
        }
        var d = a("cp-data").Set;
        b.exports = e
    }, {
        "cp-data": 19
    }],
    37: [function (a, b, c) {
        function e(a, b, c) {
            function f(b, d) {
                if (e.has(b)) throw new Error("The input graph is not a tree: " + a);
                e.add(b), c(b), a.neighbors(b).forEach(function (a) {
                    a !== d && f(a, b)
                })
            }
            var e = new d;
            if (a.isDirected()) throw new Error("This function only works for undirected graphs");
            f(b)
        }
        var d = a("cp-data").Set;
        b.exports = e
    }, {
        "cp-data": 19
    }],
    38: [function (a, b, c) {
        function f(a, b) {
            function i(c) {
                var d = a.incidentNodes(c),
                    e = d[0] !== h ? d[0] : d[1],
                    i = g.priority(e);
                if (i !== undefined) {
                    var j = b(c);
                    j < i && (f[e] = h, g.decrease(e, j))
                }
            }
            var c = new d,
                f = {},
                g = new e,
                h;
            if (a.order() === 0) return c;
            a.eachNode(function (a) {
                g.add(a, Number.POSITIVE_INFINITY), c.addNode(a)
            }), g.decrease(a.nodes()[0], 0);
            var j = !1;
            while (g.size() > 0) {
                h = g.removeMin();
                if (h in f) c.addEdge(null, h, f[h]);
                else {
                    if (j) throw new Error("Input graph is not connected: " + a);
                    j = !0
                }
                a.incidentEdges(h).forEach(i)
            }
            return c
        }
        var d = a("../Graph"),
            e = a("cp-data").PriorityQueue;
        b.exports = f
    }, {
        "../Graph": 29,
        "cp-data": 19
    }],
    39: [function (a, b, c) {
        function d(a) {
            function f(h) {
                var i = d[h] = {
                    onStack: !0,
                    lowlink: b,
                    index: b++
                };
                c.push(h), a.successors(h).forEach(function (a) {
                    a in d ? d[a].onStack && (i.lowlink = Math.min(i.lowlink, d[a].index)) : (f(a), i.lowlink = Math.min(i.lowlink, d[a].lowlink))
                });
                if (i.lowlink === i.index) {
                    var j = [],
                        k;
                    do k = c.pop(), d[k].onStack = !1, j.push(k); while (h !== k);
                    e.push(j)
                }
            }
            if (!a.isDirected()) throw new Error("tarjan can only be applied to a directed graph. Bad input: " + a);
            var b = 0,
                c = [],
                d = {},
                e = [];
            return a.nodes().forEach(function (a) {
                a in d || f(a)
            }), e
        }
        b.exports = d
    }, {}],
    40: [function (a, b, c) {
        function d(a) {
            function f(g) {
                if (g in c) throw new e;
                g in b || (c[g] = !0, b[g] = !0, a.predecessors(g).forEach(function (a) {
                    f(a)
                }), delete c[g], d.push(g))
            }
            if (!a.isDirected()) throw new Error("topsort can only be applied to a directed graph. Bad input: " + a);
            var b = {},
                c = {},
                d = [],
                g = a.sinks();
            if (a.order() !== 0 && g.length === 0) throw new e;
            return a.sinks().forEach(function (a) {
                f(a)
            }), d
        }

        function e() {}
        b.exports = d, d.CycleException = e, e.prototype.toString = function () {
            return "Graph has at least one cycle"
        }
    }, {}],
    41: [function (a, b, c) {
        function e(a) {
            function b() {
                a.call(this), this._parents = {}, this._children = {}, this._children[null] = new d
            }
            return b.prototype = new a, b.prototype.constructor = b, b.prototype.parent = function (a, b) {
                this._strictGetNode(a);
                if (arguments.length < 2) return this._parents[a];
                if (a === b) throw new Error("Cannot make " + a + " a parent of itself");
                b !== null && this._strictGetNode(b), this._children[this._parents[a]].remove(a), this._parents[a] = b, this._children[b].add(a)
            }, b.prototype.children = function (a) {
                return a !== null && this._strictGetNode(a), this._children[a].keys()
            }, b.prototype.addNode = function (b, c) {
                return b = a.prototype.addNode.call(this, b, c), this._parents[b] = null, this._children[b] = new d, this._children[null].add(b), b
            }, b.prototype.delNode = function (b) {
                var c = this.parent(b);
                return this._children[b].keys().forEach(function (a) {
                    this.parent(a, c)
                }, this), this._children[c].remove(b), delete this._parents[b], delete this._children[b], a.prototype.delNode.call(this, b)
            }, b.prototype.copy = function () {
                var b = a.prototype.copy.call(this);
                return this.nodes().forEach(function (a) {
                    b.parent(a, this.parent(a))
                }, this), b
            }, b.prototype.filterNodes = function (b) {
                function f(a) {
                    var b = c.parent(a);
                    return b === null || d.hasNode(b) ? (e[a] = b, b) : b in e ? e[b] : f(b)
                }
                var c = this,
                    d = a.prototype.filterNodes.call(this, b),
                    e = {};
                return d.eachNode(function (a) {
                    d.parent(a, f(a))
                }), d
            }, b
        }
        var d = a("cp-data").Set;
        b.exports = e
    }, {
        "cp-data": 19
    }],
    42: [function (a, b, c) {
        function h(a) {
            return Object.prototype.toString.call(a).slice(8, -1)
        }
        var d = a("../Graph"),
            e = a("../Digraph"),
            f = a("../CGraph"),
            g = a("../CDigraph");
        c.decode = function (a, b, c) {
            c = c || e;
            if (h(a) !== "Array") throw new Error("nodes is not an Array");
            if (h(b) !== "Array") throw new Error("edges is not an Array");
            if (typeof c == "string") switch (c) {
                case "graph":
                    c = d;
                    break;
                case "digraph":
                    c = e;
                    break;
                case "cgraph":
                    c = f;
                    break;
                case "cdigraph":
                    c = g;
                    break;
                default:
                    throw new Error("Unrecognized graph type: " + c)
            }
            var i = new c;
            return a.forEach(function (a) {
                i.addNode(a.id, a.value)
            }), i.parent && a.forEach(function (a) {
                a.children && a.children.forEach(function (b) {
                    i.parent(b, a.id)
                })
            }), b.forEach(function (a) {
                i.addEdge(a.id, a.u, a.v, a.value)
            }), i
        }, c.encode = function (a) {
            var b = [],
                c = [];
            a.eachNode(function (c, d) {
                var e = {
                    id: c,
                    value: d
                };
                if (a.children) {
                    var f = a.children(c);
                    f.length && (e.children = f)
                }
                b.push(e)
            }), a.eachEdge(function (a, b, d, e) {
                c.push({
                    id: a,
                    u: b,
                    v: d,
                    value: e
                })
            });
            var h;
            if (a instanceof g) h = "cdigraph";
            else if (a instanceof f) h = "cgraph";
            else if (a instanceof e) h = "digraph";
            else if (a instanceof d) h = "graph";
            else throw new Error("Couldn't determine type of graph: " + a);
            return {
                nodes: b,
                edges: c,
                type: h
            }
        }
    }, {
        "../CDigraph": 26,
        "../CGraph": 27,
        "../Digraph": 28,
        "../Graph": 29
    }],
    43: [function (a, b, c) {
        var d = a("cp-data").Set;
        c.all = function () {
            return function () {
                return !0
            }
        }, c.nodesFromList = function (a) {
            var b = new d(a);
            return function (a) {
                return b.has(a)
            }
        }
    }, {
        "cp-data": 19
    }],
    44: [function (a, b, c) {
        var d = a("./Graph"),
            e = a("./Digraph");
        d.prototype.toDigraph = d.prototype.asDirected = function () {
            var a = new e;
            return this.eachNode(function (b, c) {
                a.addNode(b, c)
            }), this.eachEdge(function (b, c, d, e) {
                a.addEdge(null, c, d, e), a.addEdge(null, d, c, e)
            }), a
        }, e.prototype.toGraph = e.prototype.asUndirected = function () {
            var a = new d;
            return this.eachNode(function (b, c) {
                a.addNode(b, c)
            }), this.eachEdge(function (b, c, d, e) {
                a.addEdge(b, c, d, e)
            }), a
        }
    }, {
        "./Digraph": 28,
        "./Graph": 29
    }],
    45: [function (a, b, c) {
        c.values = function (a) {
            var b = Object.keys(a),
                c = b.length,
                d = new Array(c),
                e;
            for (e = 0; e < c; ++e) d[e] = a[b[e]];
            return d
        }
    }, {}],
    46: [function (a, b, c) {
        b.exports = "0.7.4"
    }, {}]
}, {}, [1]);