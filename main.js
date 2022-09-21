const puppeteer = require('puppeteer')

//custom variable file
const VARIABLES = require("./variables")
//notification mp3
const notification = require("./notification")


const fs = require('fs')
//example of json data | {"itemsReserved":["Neo-Noir1429.47","Fever Dream 1022.86"]}

let rawdata = fs.readFileSync("./items.json")

const startScrape = async ()=>{
    let timeStart = Date.now()
    
    let recentlyBoughtItems = JSON.parse(rawdata)
    
    console.log("started scrape")
    const browser = await puppeteer.launch({headless:false,defaultViewport:{width:1000, height:1000}})
    const page = await browser.newPage()

        await page.goto("https://skinport.com/signin")

        await page.waitForFunction("window.location.pathname == '/'",{timeout:9999999})
        console.log("login successful")

    let wentToCart = false
    let firstTimeStartingProgram = true

    while(true){
        
        await new Promise(r => setTimeout(r, VARIABLES.itemReservationLoopDelay));
        let timeEnd = Date.now()
        let timeElapsed = Math.floor((timeEnd - timeStart)/1000/60)
        console.log("time elapsed in minutes",timeElapsed)
        if(timeElapsed>=VARIABLES.refreshMarketIntervalMinutes){
            timeStart = Date.now()
            wentToCart = true
        }
        if(wentToCart || firstTimeStartingProgram){
            wentToCart = false
            firstTimeStartingProgram=false
        await page.goto("https://skinport.com/market")
        await page.waitForSelector("div.CatalogHeader-right > button",{visible:true,timeout:99999999})
        await page.click("div.CatalogHeader-right > button")
        await page.waitForSelector(".SideFilter.SideFilter--opened",{visible:true,timeout:99999999})
        // await page.hover(".Dropdown-button")
        await new Promise(r => setTimeout(r, 600));
        await page.click("div.SideFilter-header > div > div > div > button.Dropdown-button")
        await page.waitForSelector(".Dropdown-itemText",{visible:true,timeout:99999999})
        const dropDownList = await page.$$(".Dropdown-itemText")
        // console.log(dropDownList)
        // const newest = dropDownList.filter(async (x)=>{
        //     let value = await x.evaluate(el=>el.textContent)
        //     console.log(value)
        //     if(value == "Newest"){
        //     return x
        //     }
        //     return false
        // })
        
        let newest = null
        for (let x of dropDownList){
            let value = await x.evaluate(el=>el.textContent)
            // console.log(value)
            if(value === "Newest")
            newest = x
        }
        // console.log(await newest.evaluate(x=>x.textContent))
        
        await newest.click()
        await page.waitForSelector("div.SideFilter-header > div > div > button.LiveBtn",{timeout:9999999})
        await page.click("div.SideFilter-header > div > div > button.LiveBtn")
        
        await page.waitForSelector("div.CommonLayout.CommonLayout--filterShown > div.CommonLayout-filter > div > div.SideFilter-header > div > button")
        await page.click("div.CommonLayout.CommonLayout--filterShown > div.CommonLayout-filter > div > div.SideFilter-header > div > button")
        }

    
    
        /////check through items
    
    
        // await page.waitForNavigation({waitUntil:"networkidle2"})
    
        await page.waitForSelector(".ItemPreview-content")
        const items = await page.$$(".ItemPreview-content")
        console.log(items.length)
        let listOfElementsIwant = []
        let count = 0
        for(const el of items){
            try{
                let itemName = (await (await el.$("div.ItemPreview-wrapper > a > div.ItemPreview-commonInfo > div.ItemPreview-itemInfo > div.ItemPreview-itemName")).evaluate(el=>el.textContent))
                let discountCode = (await (await el.$(".GradientLabel.ItemPreview-discount")).evaluate(el=>el.textContent)).replace("− ","").replace("%","")
                let itemPrice = (await (await el.$("div.ItemPreview-price > div.ItemPreview-priceValue > div.Tooltip-link")).evaluate(el=>el.textContent)).replace("CA$","")
                let addToCartTrue = await (await el.$("button.ItemPreview-mainAction")).evaluate(el=>el.textContent) == "Add to cart"

                // console.log("addToCartTrue",addToCartTrue)
                
                // console.log(discountCode)
                
                let wasItemAlreadySniped = recentlyBoughtItems.itemsReserved.filter(x=>x==itemName+discountCode+itemPrice).length > 0

                if(count >= 2) break;
    
                if(discountCode >= VARIABLES.discountLowerLimit && itemPrice>=VARIABLES.itemPriceLowerLimit && itemPrice <= VARIABLES.itemPriceUpperLimit && addToCartTrue && wasItemAlreadySniped != true){
                    recentlyBoughtItems.itemsReserved.push(itemName+discountCode+itemPrice)
                    fs.writeFile("./items.json", JSON.stringify(recentlyBoughtItems), err=>{
                        if(err) console.log("Error writing file:", err)
                    })
                    console.log("bruh")

                    listOfElementsIwant.push(el)
                    count = count+1
                }
            }catch(e){
                // console.log(e.message)
            }
        }
        // console.log(listOfElementsIwant)
        
       

        if(listOfElementsIwant.length < 1){
            console.log("restarting loop")
            continue
        }
    
        // start adding items to cart
        for(const el of listOfElementsIwant){
            try{
                let addToCart = await el.$("button.ItemPreview-mainAction")
                // console.log(addToCart)
                // await addToCart.waitForSelector("button.ItemPreview-mainAction",{visible:true})
                await addToCart.click()
            }catch(e){
    
            }
        }
    
        await page.goto("https://skinport.com/cart")

        wentToCart=true
        
        //problems here does not find the selector
        try{
            await page.waitForSelector(".Checkbox-input")
        }catch(e){
            wentToCart = true
            continue
        }
        const tradelockBox = await page.$(".Checkbox-input[name=tradelock]")
        const cancelationBox = await page.$(".Checkbox-input[name=cancellation]")
        console.log("tradelockBox",tradelockBox)
        console.log("cancelationBox",cancelationBox)
    
        if(tradelockBox != null){
            await tradelockBox.click()
        }
        if(cancelationBox != null){
            await cancelationBox.click()
        }

        if(tradelockBox==null && cancelationBox == null){
            wentToCart = true
            continue
        }
    
        await page.click("div.CartSummary-payment > div > button")
        await page.waitForResponse(response=>response.url().includes("https://checkoutshopper-live.adyen.com/checkoutshopper/securedfields/live_ISN24H4WJFDWNBNUGGHCLKXXDIH4UEVI/4.2.1/securedFields.html") && response.status() == 200)
        await new Promise(r => setTimeout(r, 2500));
    
        const cvcIFrame = await page.$("iframe[title='Iframe for secured card security code']")
        if(cvcIFrame == null){
            wentToCart = true
            continue
        }
        const cvcBox = await cvcIFrame.contentFrame()
        const cvcFrameInputBox = await cvcBox.$("[data-fieldtype='encryptedSecurityCode']")
        if(cvcFrameInputBox != null){
            await cvcFrameInputBox.focus()
            await cvcFrameInputBox.type("000")
            await page.click(".adyen-checkout__button.adyen-checkout__button--pay")
            notification()
        }

    }
}

startScrape()
