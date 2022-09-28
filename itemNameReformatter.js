/**
 * 
 * @param {string} itemType 
 * @param {string} itemName 
 * @param {string} itemFloat 
 * @returns formatted item under the naming convention of the scraper json file fetched from the internet
 */
const reformatAsKeyValue = (itemType,itemName,itemFloat)=>{
    let searchFloat = ""

    let vanilla = false
    let stattrack = false
    let knife = false
    let gloves = false

    if(itemName.toLowerCase().includes("vanilla")){
        vanilla = true
    }
    if(itemFloat.toLowerCase().includes("stattrak")){
        stattrack = true
    }
    if(itemFloat.toLowerCase().includes("knife")){
        knife = true
    }
    if(itemFloat.toLowerCase().includes("gloves")){
        gloves = true
    }


    if(itemFloat.includes("Factory New"))
        searchFloat = "(Factory New)"
    else if(itemFloat.includes("Minimal Wear"))
        searchFloat = "(Minimal Wear)"
    else if(itemFloat.includes("Field-Tested"))
        searchFloat = "(Field-Tested)"
    else if(itemFloat.includes("Well-Worn"))
        searchFloat = "(Well-Worn)"
    else if(itemFloat.includes("Battle-Scarred"))
        searchFloat = "(Battle-Scarred)"

    let realItemType = itemType.replace("★","\\u2605").replace("™","\\u2122")
    
    if(knife){
        if(!stattrack && vanilla){
            return `\\u2605 ${realItemType}`
        }
        else if(stattrack && vanilla){
            return `${realItemType}`
        }
        else if(!vanilla && !stattrack){
            return `\\u2605 ${realItemType} | ${itemName} ${searchFloat}`
        }
        else if(!vanilla && stattrack){
            return `${realItemType} | ${itemName} ${searchFloat}`
        }
    }else if(gloves){
        return `\\u2605 ${realItemType} | ${itemName} ${searchFloat}`
    }
    
    return `${realItemType} | ${itemName} ${searchFloat}`
    

}

module.exports = reformatAsKeyValue