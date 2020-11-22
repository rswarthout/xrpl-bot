const moment = require('moment');
const util = require('util');
const RippleAPI = require('ripple-lib').RippleAPI;

const accountNamesJson = require('./account-names.json');
const accountNames = {};

module.exports = ({ app }) => {

    app.on(['issues.opened'], async context => {
        await generateResponse(context, context.payload.issue.body)
    })

    app.on(['issue_comment.created'], async context => {

        if (context.payload.comment.user.login === 'xrpl-bot[bot]') {
            // We only need to be parsing comments created by others
            return;
        }

        await generateResponse(context, context.payload.comment.body)
    })
}

let generateResponse = async function(context, body) {

    let match = body.match(/(@xrpl\-bot)[\s\n\r]+([\dA-Z]{64})/i);

    if (match === null) {
        return;
    }

    hash = match[2];

    let tx = await getTransaction(hash);
    let commentDetails = [];

    if (tx.status === 'error') {
        commentDetails.push("# Internal Error - Transaction Details");
        commentDetails.push("The transaction could not be returned at this time.");
    } else {
        commentDetails.push("# Transaction Details");
        commentDetails.push("**Hash:** [" + hash + "](https://xrpscan.com/tx/" + hash + ")");
        commentDetails.push.apply(commentDetails, buildGeneralDetailsTable(tx));
        commentDetails.push.apply(commentDetails, buildDetailExplanationForTransactionType(tx));
        commentDetails.push("## Transaction JSON");
        commentDetails.push("``` js ");
        commentDetails.push(JSON.stringify(tx, null, 2))
        commentDetails.push("```");
    }

    const issueComment = context.issue({ body: commentDetails.join("\n") });
    return context.octokit.issues.createComment(issueComment);
};

let buildGeneralDetailsTable = function(tx)
{
    let commentDetails = [];
    commentDetails.push("| Property | Value |");
    commentDetails.push("| :--- | :--- |");
    commentDetails.push("| Type | " + tx.TransactionType + " |");
    commentDetails.push("| Initiated By | " + getAccountName(tx.Account) + " " + linkToAccount(tx.Account) + " |");
    commentDetails.push("| Sequence | " + tx.Sequence + " |");
    commentDetails.push("| XRPL fee | " + dropsToXrp(tx.Fee) + " XRP |");
    commentDetails.push("| Date | " + rippleDateToReadable(tx.date) + " |");
    commentDetails.push("| Validated | " + ((tx.validated) ? "`true`" : "`false`") + " |");
    commentDetails.push("");

    return commentDetails;
};

// Function to handle routing to the correct transaction type handler
let buildDetailExplanationForTransactionType = function(tx)
{
    switch (tx.TransactionType) {
        case 'AccountSet':
            return buildDetailedAccountSetExplanation(tx);

        case 'AccountDelete':
            return buildDetailedAccountDeleteExplanation(tx);

        case 'CheckCancel':
            return buildNoSupportedExplanation(tx);
            //return buildDetailedCheckCancelExplanation(tx);

        case 'CheckCash':
            return buildNoSupportedExplanation(tx);
            //return buildDetailedCheckCashExplanation(tx);

        case 'CheckCreate':
            return buildNoSupportedExplanation(tx);
            //return buildDetailedCheckCreateExplanation(tx);

        case 'DepositPreauth':
            return buildNoSupportedExplanation(tx);
            //return buildDetailedDepositPreauthExplanation(tx);

        case 'EscrowCancel':
            return buildNoSupportedExplanation(tx);
            //return buildDetailedEscrowCancelExplanation(tx);

        case 'EscrowCreate':
            return buildDetailedEscrowCreateExplanation(tx);

        case 'EscrowFinish':
            return buildDetailedEscrowFinishExplanation(tx);

        case 'OfferCancel':
            return buildDetailedOfferCancelExplanation(tx);

        case 'OfferCreate':
            return buildDetailedOfferCreateExplanation(tx);

        case 'Payment':
            return buildDetailedPaymentExplanation(tx);

        case 'PaymentChannelClaim':
            return buildDetailedPaymentChannelClaimExplanation(tx);

        case 'PaymentChannelCreate':
            return buildNoSupportedExplanation(tx);
            //return buildDetailedPaymentChannelCreateExplanation(tx);

        case 'PaymentChannelFund':
            return buildNoSupportedExplanation(tx);
            //return buildDetailedPaymentChannelFundExplanation(tx);

        case 'SetRegularKey':
            return buildNoSupportedExplanation(tx);
            //return buildDetailedSetRegularKeyExplanation(tx);

        case 'SignerListSet':
            return buildNoSupportedExplanation(tx);
            //return buildDetailedSignerListSetExplanation(tx);

        case 'TrustSet':
            return buildNoSupportedExplanation(tx);
            //return buildDetailedTrustSetExplanation(tx);
    }
};

let buildNoSupportedExplanation = function(tx)
{
    let commentDetails = [];

    commentDetails.push("");
    commentDetails.push("The transaction type of **`" + tx.TransactionType + "`** is not currently supported for a detailed explanation.");
    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: AccountSet
let buildDetailedAccountSetExplanation = function(tx)
{
    let commentDetails = [];

    commentDetails.push("## Changes");
    commentDetails.push("| Property | Value |");
    commentDetails.push("| :--- | :--- |");

    for (key in tx.rippleLib.specification) {
        commentDetails.push("| `" + key + "` | `" + tx.rippleLib.specification[key] + "` |");
    }

    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: AccountDelete
let buildDetailedAccountDeleteExplanation = function(tx)
{
    let commentDetails = [];

    commentDetails.push("");
    commentDetails.push("Account " + getAccountName(tx) + " **`" + tx.Account + "`** was **DELETED**. The remaining **`" + dropsToXrp(tx.meta.DeliveredAmount) + "`** XRP were sent to " + getAccountName(tx.Destination) + " **`" + tx.Destination + "`**" + (('DestinationTag' in tx) ? " (DT: `" + tx.DestinationTag + "`)" : ""));
    commentDetails.push("");

    let deletedNode;

    for (m in tx.meta.AffectedNodes) {
        if (('DeletedNode' in tx.meta.AffectedNodes[m]) && tx.meta.AffectedNodes[m].DeletedNode.LedgerEntryType === 'AccountRoot') {
            deletedNode = tx.meta.AffectedNodes[m].DeletedNode;
        }
    }

    commentDetails.push("");
    commentDetails.push("## Balance Changes");
    commentDetails.push("| Step | Value |");
    commentDetails.push("| :--- | ---: |")
    commentDetails.push("| Starting Balance | `" + dropsToXrp(deletedNode.PreviousFields.Balance) + "` |");
    commentDetails.push("| Transaction Fee | `-" + dropsToXrp(tx.Fee) + "` |");
    commentDetails.push("| Sent to " + getAccountName(tx.Destination) + " **`" + tx.Destination + "`**" + (('DestinationTag' in tx) ? " (DT: `" + tx.DestinationTag + "`)" : "") + " | `-" + dropsToXrp(tx.meta.DeliveredAmount) + "` |");
    commentDetails.push("|  | -------------- |");
    commentDetails.push("| Resulting Balance | **`" + dropsToXrp(deletedNode.FinalFields.Balance) + "`** |");
    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: CheckCancel
let buildDetailedCheckCancelExplanation = function(tx)
{
    let commentDetails = [];

    return commentDetails;
};

// Transaction Type: CheckCash
let buildDetailedCheckCashExplanation = function(tx)
{
    let commentDetails = [];

    return commentDetails;
};

// Transaction Type: CheckCreate
let buildDetailedCheckCreateExplanation = function(tx)
{
    let commentDetails = [];

    return commentDetails;
};

// Transaction Type: DepositPreauth
let buildDetailedDepositPreauthExplanation = function(tx)
{
    let commentDetails = [];

    return commentDetails;
};

// Transaction Type: EscrowCancel
let buildDetailedEscrowCancelExplanation = function(tx)
{
    let commentDetails = [];

    return commentDetails;
};

// Transaction Type: EscrowCreate
let buildDetailedEscrowCreateExplanation = function(tx)
{
    let commentDetails = [];
    let escrowData;

    for (i in tx.meta.AffectedNodes) {
        if ('CreatedNode' in tx.meta.AffectedNodes[i]) {
            escrowData = tx.meta.AffectedNodes[i].CreatedNode.NewFields;
            break;
        }
    }

    commentDetails.push("");
    commentDetails.push("Account " + getAccountName(tx) + " **`" + escrowData.Account + "`** created an escrow for **`" + dropsToXrp(escrowData.Amount) + "`** XRP that will expire on **`" + rippleDateToReadable(escrowData.FinishAfter) + "`** and be credited into " + getAccountName(tx) + " **`" + escrowData.Destination + "`**.");
    commentDetails.push("");

    let modifiedNode;
    let escrowNode;

    for (m in tx.meta.AffectedNodes) {
        if (('ModifiedNode' in tx.meta.AffectedNodes[m]) && tx.meta.AffectedNodes[m].ModifiedNode.LedgerEntryType === 'AccountRoot') {
            modifiedNode = tx.meta.AffectedNodes[m].ModifiedNode;
        }

        if (('CreatedNode' in tx.meta.AffectedNodes[m]) && tx.meta.AffectedNodes[m].CreatedNode.LedgerEntryType === 'Escrow') {
            escrowNode = tx.meta.AffectedNodes[m].CreatedNode;
        }
    }

    commentDetails.push("");
    commentDetails.push("## Balance Changes");
    commentDetails.push("| Step | Value |");
    commentDetails.push("| :--- | ---: |")
    commentDetails.push("| Starting Balance | `" + dropsToXrp(modifiedNode.PreviousFields.Balance) + "` |");
    commentDetails.push("| Escrow Create | `-" + dropsToXrp(escrowNode.NewFields.Amount) + "` |");
    commentDetails.push("| Transaction Fee | `-" + dropsToXrp(tx.Fee) + "` |");
    commentDetails.push("|  | -------------- |");
    commentDetails.push("| Resulting Balance | **`" + dropsToXrp(modifiedNode.FinalFields.Balance) + "`** |");
    commentDetails.push("");

    commentDetails.push("");
    commentDetails.push("## Signers");

    for (s in tx.Signers) {
        commentDetails.push("* " + getAccountName(tx.Signers[s].Signer.Account) + " " + linkToAccount(tx.Signers[s].Signer.Account));
    }

    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: EscrowFinish
let buildDetailedEscrowFinishExplanation = function(tx)
{
    let commentDetails = [];

    let escrowOwner = tx.rippleLib.specification.owner;

    commentDetails.push("");
    commentDetails.push("Account " + getAccountName(tx.Account) + " **`" + tx.Account + "`** finished the escrow. Account " + getAccountName(escrowOwner) + " **`" + escrowOwner + "`** received **`" + tx.rippleLib.outcome.balanceChanges[escrowOwner][0].value + "`** " + tx.rippleLib.outcome.balanceChanges[escrowOwner][0].currency + ".");
    commentDetails.push("");

    let modifiedNode;
    let escrowNode;

    for (m in tx.meta.AffectedNodes) {
        if (('ModifiedNode' in tx.meta.AffectedNodes[m])
            && tx.meta.AffectedNodes[m].ModifiedNode.LedgerEntryType === 'AccountRoot'
            && tx.meta.AffectedNodes[m].ModifiedNode.FinalFields.Account === escrowOwner
        ) {
            modifiedNode = tx.meta.AffectedNodes[m].ModifiedNode;
        }

        if (('DeletedNode' in tx.meta.AffectedNodes[m]) && tx.meta.AffectedNodes[m].DeletedNode.LedgerEntryType === 'Escrow') {
            escrowNode = tx.meta.AffectedNodes[m].DeletedNode;
        }
    }

    commentDetails.push("");
    commentDetails.push("## Balance Changes");
    commentDetails.push("| Step | Value |");
    commentDetails.push("| :--- | ---: |")
    commentDetails.push("| Starting Balance | `" + dropsToXrp(modifiedNode.PreviousFields.Balance) + "` |");
    commentDetails.push("| Escrow Release | `+" + dropsToXrp(escrowNode.FinalFields.Amount) + "` |");

    if (tx.Account === tx.Owner) {
        commentDetails.push("| Transaction Fee | `-" + dropsToXrp(tx.Fee) + "` |");
    }

    commentDetails.push("|  | -------------- |");
    commentDetails.push("| Resulting Balance | **`" + dropsToXrp(modifiedNode.FinalFields.Balance) + "`** |");
    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: OfferCancel
let buildDetailedOfferCancelExplanation = function(tx)
{
    let commentDetails = [];
    let change;

    commentDetails.push("");
    commentDetails.push("## Orderbook Changes");
    commentDetails.push("| Direction | Quantity | Price | Status | Exchange Rate |");
    commentDetails.push("| :--- | :--- | :--- | :--- | :--- |");

    for (accountId in tx.rippleLib.outcome.orderbookChanges) {
        for (i in tx.rippleLib.outcome.orderbookChanges[accountId]) {
            change = tx.rippleLib.outcome.orderbookChanges[accountId][i];
            commentDetails.push("| " + change.direction + " | `" + change.quantity.value + "` `" + change.quantity.currency + " / " + change.quantity.counterparty + "` | `" + change.totalPrice.value + "` " + change.totalPrice.currency + " | `" + change.status + "` | `" + change.makerExchangeRate + "` |");
        }
    }

    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: OfferCreate
let buildDetailedOfferCreateExplanation = function(tx)
{
    let commentDetails = [];
    let change;

    commentDetails.push("");
    commentDetails.push("## Orderbook Changes");
    commentDetails.push("| Direction | Quantity | Price | Status | Exchange Rate |");
    commentDetails.push("| :--- | :--- | :--- | :--- | :--- |");

    for (accountId in tx.rippleLib.outcome.orderbookChanges) {
        for (i in tx.rippleLib.outcome.orderbookChanges[accountId]) {
            change = tx.rippleLib.outcome.orderbookChanges[accountId][i];
            commentDetails.push("| " + change.direction + " | `" + change.quantity.value + "` `" + change.quantity.currency + " / " + change.quantity.counterparty + "` | `" + change.totalPrice.value + "` " + change.totalPrice.currency + " | `" + change.status + "` | `" + change.makerExchangeRate + "` |");
        }
    }

    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: Payment - currently only supports a transfer from one account to another.
let buildDetailedPaymentExplanation = function(tx)
{
    let commentDetails = [];

    commentDetails.push("");
    commentDetails.push("Account " + getAccountName(tx) + " **`" + tx.Account + "`** sent **`" + tx.rippleLib.outcome.deliveredAmount.value + "`** " + tx.rippleLib.outcome.deliveredAmount.currency + " to " + getAccountName(tx.Destination) + " **`" + tx.Destination + "`**" + (('DestinationTag' in tx) ? " (DT: `" + tx.DestinationTag + "`)" : "") + ".");
    commentDetails.push("");

    commentDetails.push("| Account | XRP Balance Before | XRP Balance After | Difference | Explanation |");
    commentDetails.push("| :--- | ---: | ---: | ---: | :--- |");

    for (i in tx.meta.AffectedNodes) {

        let account = tx.meta.AffectedNodes[i].ModifiedNode;
        let difference = dropsToXrp(account.FinalFields.Balance - account.PreviousFields.Balance);
        let formattedDifference = difference;

        if (difference > 0) {
            formattedDifference = "+" + difference;
        }

        let explanation = '';

        if (i === 0) {
            explanation = "`" + difference + "` received from **`" + ellipsifyAccount(tx.Account) + "`**";
        } else if (i === 1) {
            explanation = "`" + difference + "` sent to **`" + ellipsifyAccount(tx.Destination) + "`** + `" + dropsToXrp(tx.Fee) + "` fee";
        }

        commentDetails.push("| `" + ellipsifyAccount(account.FinalFields.Account) + "` | `" + dropsToXrp(account.PreviousFields.Balance) + "` | `" + dropsToXrp(account.FinalFields.Balance) + "` | `" + formattedDifference + "` | " + explanation + " |");
    }

    commentDetails.push("| | | | **`" + dropsToXrp(tx.Fee) + "`** | (the fee that was burned) |");
    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: PaymentChanncelClaim
let buildDetailedPaymentChannelClaimExplanation = function(tx)
{
    let outcome = tx.outcome;
    let commentDetails = [];

    commentDetails.push("The channel **`" + tx.specification.channel + "`** claimed **`" + dropsToXrp(outcome.channelChanges.channelBalanceChangeDrops) + "`** XRP.");

    /*
    commentDetails.push("| Steps | Value |");
    commentDetails.push("| :--- | ---: |");
    commentDetails.push("| Account Balance Before | " +  + " |");
    commentDetails.push("| Claimed Amount | +" + outcome.balanceChanges[tx.address][0].value + " |");
    commentDetails.push("| Transaction Fee | `-" + outcome.fee + "` |");
    commentDetails.push("| | -------- |");
    commentDetails.push("| txing Account Balance | " +  + " |");
    */

    return commentDetails;
};

// Transaction Type: PaymentChannelCreate
let buildDetailedPaymentChannelCreateExplanation = function(tx)
{
    let commentDetails = [];

    return commentDetails;
};

// Transaction Type: PaymentChannelFund
let buildDetailedPaymentChannelFundExplanation = function(tx)
{
    let commentDetails = [];

    return commentDetails;
};

// Transaction Type: SetRegularKey
let buildDetailedSetRegularKeyExplanation = function(tx)
{
    let commentDetails = [];

    return commentDetails;
};

// Transaction Type: SignerListSet
let buildDetailedSignerListSetExplanation = function(tx)
{
    let commentDetails = [];

    return commentDetails;
};

// Transaction Type: TrustSet
let buildDetailedTrustSetExplanation = function(tx)
{
    let commentDetails = [];

    return commentDetails;
};

let ellipsifyAccount = function(account)
{
    return account.substring(0, 3) + ".." + account.substring(account.length - 3);
};

let getTransaction = async function(hash) {

    let api = new RippleAPI({
        server: 'wss://xrpl.ws'
    });

    await api.connect();
    let response = await api.getTransaction(hash, {
        includeRawTransaction: true
    });

    api.disconnect();

    let originalTransaction = JSON.parse(response.rawTransaction);
    let responseCopy = response;
    delete responseCopy.rawTransaction;

    originalTransaction.rippleLib = responseCopy;

    if (process.env.ENVIRONMENT === 'development') {
        console.log(util.inspect(originalTransaction, true, null, true));
    }

    return originalTransaction;
}

let linkToAccount = function(id)
{
    return "[" + id + "](https://xrpscan.com/account/" + id + ")";
};

let getAccountName = function(accountId)
{
    if (Object.keys(accountNames).length === 0) {
        for (i in accountNamesJson) {
            accountNames[accountNamesJson[i].account] = accountNamesJson[i];
        }
    }

    if (!(accountId in accountNames)) {
        return "";
    }

    let name = accountNames[accountId].name;

    if ('desc' in accountNames[accountId]) {
        name += " (" + accountNames[accountId].desc + ")"
    }

    return "[" + name + "](https://xrpscan.com/account/" + accountId + ")";
};

let rippleDateToReadable = function(rippleDate)
{
    let epoch = moment.utc("2000-01-01T00:00:00");
    epoch.add(rippleDate, 's');
    return epoch.format();
};

let dropsToXrp = function(amount)
{
    return (amount / 1000000);
};