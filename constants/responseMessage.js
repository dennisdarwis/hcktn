class ResponseCode{
    static get INVALID_BSB(){ return "Invalid BSB" }
    static get INVALID_ACCOUNT_NUMBER(){ return "Invalid Account Number" }
    static get MESSAGE_FORMAT_ERROR(){ return "Message format error" }
    static get APPROVED(){ return "Approved" }
    static get DUPLICATE_MESSAGE(){ return "Duplicate Message" }
    static get INSUFFICIENT_FUNDS(){ return "Insufficient Funds" }
}

module.exports = ResponseCode;