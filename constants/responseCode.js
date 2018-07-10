class ResponseCode{
    static get INVALID_BSB(){ return "898" }
    static get INVALID_ACCOUNT_NUMBER(){ return "899" }
    static get MESSAGE_FORMAT_ERROR(){ return "800" }
    static get APPROVED(){ return "000" }
    static get DUPLICATE_MESSAGE(){ return "333" }
    static get INSUFFICIENT_FUNDS(){ return "121" }
}

module.exports = ResponseCode;