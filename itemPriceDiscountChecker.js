const discountChecker = (skinportPrice, marketPrice)=>{
    if(typeof marketPrice == "undefined")
        return -100
    return (marketPrice/skinportPrice)*100-100
}

module.exports = discountChecker