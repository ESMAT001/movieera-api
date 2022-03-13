const { JSDOM } = require("jsdom");
const got = require("got");

function customDownloadLinkExtractor(nodes, url) {
    const createEnglishNames = (name) => {
        switch (name) {
            case 'نسخه دوبله فارسی':
                return "persian_lang";
            case 'نسخه زبان اصلی':
                return "original_lang";
            case "نسخه زیرنویس فارسی چسبیده":
                return "persian_sub";
            default:
                return name;
        }
    }
    const createDataMap = (nodes) => {
        const _dataMap = []
        for (let index = 0; index < nodes.length; index++) {
            switch (nodes[index].textContent) {
                case 'نسخه دوبله فارسی':
                case 'نسخه زبان اصلی':
                case "نسخه زیرنویس فارسی چسبیده":
                    _dataMap.push({ name: createEnglishNames(nodes[index].textContent), index: index })
                    break;
                default:
                    break;
            }
        }
        return _dataMap
    }
    const splitNodes = (_nodes, dataMap) => {
        const nodes = Array.from(_nodes)
        const result = []
        for (let index = 0; index < dataMap.length; index++) {
            if (index === dataMap.length - 1) {
                result.push(nodes.slice(dataMap[index].index))
            } else {
                result.push(nodes.slice(dataMap[index].index, dataMap[index + 1].index))
            }
        }
        return result
    }

    function genrateDownloadLinks(nodes) {
        const { document: htmlNode } = (new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>")).window;
        Array.from(nodes).forEach(node => {
            htmlNode.body.appendChild(node)
        })
        // const htmlNode = new JSDOM(nodes).window.document;
        const downloadLinks = []
        const downloadLinksNodes = htmlNode.querySelectorAll('p>a')
        console.log(downloadLinksNodes.length)
        for (let index = 0; index < downloadLinksNodes.length; index++) {
            downloadLinks.push(downloadLinksNodes[index].href)
        }
        const downloadLinksText = []
        const downloadLinksTextNodes = htmlNode.querySelectorAll('p>span>*')
        for (let index = 0; index < downloadLinksTextNodes.length; index++) {
            downloadLinksText.push(downloadLinksTextNodes[index].textContent.match(/[a-zA-Z 0-9]/g).join("").trim())
        }
        const result = []
        for (let index = 0; index < downloadLinks.length; index++) {
            result.push({
                downloadLinks: downloadLinks[index],
                quality: downloadLinksText[index]
            })
        }
        return result
    }



    let dataMap = createDataMap(nodes)
    if (dataMap.length === 0) {
        return {
            original_lang: genrateDownloadLinks(nodes)
        }
    }

    let result = splitNodes(nodes, dataMap)
    const dlLinks = {}
    for (let index = 0; index < result.length; index++) {
        dlLinks[dataMap[index].name] = genrateDownloadLinks(result[index])
    }
    return dlLinks
    //split nodes based on dataMap

}



const getHtml = async (url) => {
    const response = await got(url);
    return response.body;
}
async function main() {
    const html = await getHtml("https://www.f2m.site/11728/blacklight/")
    const { document } = (new JSDOM(html)).window;
    const data = document.querySelectorAll("div.contentbox>div.txtbbb>*")
    console.log(customDownloadLinkExtractor(data, "https://www.f2m.site/11405/spider-"))
    debugger
    // console.log(html)
}
//run main function infinitely
setTimeout(() => {
    main()
}, 1000);






