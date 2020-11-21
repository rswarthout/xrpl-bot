const axios = require('axios');
const moment = require('moment');
const util = require('util');
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

    // Let's first check for the @mention of @xrpl-bot
    let mention = body.match(/(@xrpl\-bot)/i)

    if (mention === null) {
        // There was no mention of the bot, exiting
        return;
    }

    let hash = body.match(/([\dA-Z]){64}/)

    if (hash === null) {
        // We couldn't detect a transaction hash, exiting
        return;
    }

    hash = hash[0];

    let tx = await getTransaction(hash);
    let commentDetails = [];

    if (tx.status === 'error') {
        commentDetails.push("# Internal Error - Transaction Details");
        commentDetails.push("The transaction could not be returned at this time.");
    } else {
        commentDetails.push("# Transaction Details");
        commentDetails.push("**Hash:** [" + hash + "](https://xrpscan.com/tx/" + hash + ")");
        commentDetails.push.apply(commentDetails, buildGeneralDetailsTable(tx.result));
        commentDetails.push.apply(commentDetails, buildDetailExplanationForTransactionType(tx.result));
        commentDetails.push("## Transaction JSON");
        commentDetails.push("``` js ");
        commentDetails.push(JSON.stringify(tx.result, null, 2))
        commentDetails.push("```");
    }

    const issueComment = context.issue({ body: commentDetails.join("\n") });
    return context.octokit.issues.createComment(issueComment);
};

let buildGeneralDetailsTable = function(tx)
{
    let epoch = moment.utc("2000-01-01");
    epoch.add(tx.date, 's');

    let commentDetails = [];
    commentDetails.push("| Property | Value |");
    commentDetails.push("| :--- | :--- |");
    commentDetails.push("| Type | " + tx.TransactionType + " |");
    commentDetails.push("| Initiated By | " + linkToAccount(tx.Account) + " |");
    commentDetails.push("| Sequence | " + tx.Sequence + " |");
    commentDetails.push("| XRPL fee | " + (tx.Fee / 1000000) + " XRP |");
    commentDetails.push("| Date | " + epoch.format() + " |");
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
            return buildNoSupportedExplanation(tx);
            //return buildDetailedOfferCancelExplanation(tx);

        case 'OfferCreate':
            return buildNoSupportedExplanation(tx);
            //return buildDetailedOfferCreateExplanation(tx);

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

    /*
    @TODO deal with exposing the fields changed.

    for (key in result.specification) {
        commentDetails.push("| `" + key + "` | `" + tx.specification[key] + "` |");
    }
    */

    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: AccountDelete
let buildDetailedAccountDeleteExplanation = function(tx)
{
    let commentDetails = [];

    commentDetails.push("");
    commentDetails.push("Account " + getAccountName(tx) + " **`" + tx.Account + "`** was **DELETED**. The remaining **`" + (tx.sup.deliveredAmount.value / 1000000) + "`** " + tx.sup.deliveredAmount.currency + " were sent to " + getAccountName(tx) + " **`" + tx.Destination + "`**" + (('DestinationTag' in tx) ? " (DT: `" + tx.DestinationTag + "`)" : ""));
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
    commentDetails.push("Account " + getAccountName(tx) + " **`" + escrowData.Account + "`** created an escrow for **`" + (escrowData.Amount / 1000000) + "`** XRP that will expire on `" + rippleDateToReadable(escrowData.FinishAfter) + "` and be credited into " + getAccountName(tx) + " **`" + escrowData.Destination + "`**.");
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
/*
    let escrowOwner = tx.specification.owner;

    commentDetails.push("");
    commentDetails.push("Account " + getAccountName(tx) + " **`" + tx.Account + "`** finished the escrow. Account " + getAccountName(tx) + " **`" + escrowOwner + "`** received **`" + tx.outcome.balanceChanges[escrowOwner][0].value + "`** " + tx.outcome.balanceChanges[escrowOwner][0].currency + ".");
    commentDetails.push("");
*/
    return commentDetails;
};

// Transaction Type: OfferCancel
let buildDetailedOfferCancelExplanation = function(tx)
{
    let commentDetails = [];

    return commentDetails;
};

// Transaction Type: OfferCreate
let buildDetailedOfferCreateExplanation = function(tx)
{
    let commentDetails = [];

    commentDetails.push("**`" + tx.Account + "`** placed an offer:");

    if (tx.TakerGets instanceof Object) {
        commentDetails.push("`TakerGets`: **`" + tx.TakerGets.value + "` " + tx.TakerGets.currency + "/" + tx.TakerGets.issuer + "**");
    } else {
        commentDetails.push("`TakerGets`: **`" + (tx.TakerGets / 1000000) + "` XRP**");
    }

    if (tx.TakerPays instanceof Object) {
        commentDetails.push("`TakerPays`: **`" + tx.TakerPays.value + "` " + tx.TakerPays.currency + "/" + tx.TakerPays.issuer + "**");
    } else {
        commentDetails.push("`TakerPays`: **`" + (tx.TakerPays / 1000000) + "` XRP**");
    }

    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: Payment - currently only supports a transfer from one account to another.
let buildDetailedPaymentExplanation = function(tx)
{
    let commentDetails = [];

    commentDetails.push("");
    commentDetails.push("Account " + getAccountName(tx) + " **`" + tx.Account + "`** sent **`" + (tx.sup.deliveredAmount.value / 1000000) + "`** " + tx.sup.deliveredAmount.currency + " to " + getAccountName(tx) + " **`" + tx.Destination + "`**" + (('DestinationTag' in tx) ? " (DT: `" + tx.DestinationTag + "`)" : ""));
    commentDetails.push("");

    commentDetails.push("| Account | XRP Balance Before | XRP Balance After | Difference | Explanation |");
    commentDetails.push("| :--- | ---: | ---: | ---: | :--- |");

    for (let i = 0; i < tx.meta.AffectedNodes.length; i++) {

        let account = tx.meta.AffectedNodes[i].ModifiedNode;
        let difference = ((account.FinalFields.Balance - account.PreviousFields.Balance) / 1000000);
        let formattedDifference = difference;

        if (difference > 0) {
            formattedDifference = "+" + difference;
        }

        let explanation = '';

        if (i === 0) {
            explanation = "`" + difference + "` received from **`" + ellipsifyAccount(tx.Account) + "`**";
        } else if (i === 1) {
            explanation = "`" + difference + "` sent to **`" + ellipsifyAccount(tx.Destination) + "`** + `" + ((tx.Fee / 1000000)) + "` fee";
        }

        commentDetails.push("| `" + ellipsifyAccount(account.FinalFields.Account) + "` | `" + (account.PreviousFields.Balance / 1000000) + "` | `" + (account.FinalFields.Balance / 1000000) + "` | `" + formattedDifference + "` | " + explanation + " |");
    }

    commentDetails.push("| | | | **`" + (tx.Fee / 1000000) + "`** | (the fee that was burned) |");
    commentDetails.push("");

    return commentDetails;
};

// Transaction Type: PaymentChanncelClaim
let buildDetailedPaymentChannelClaimExplanation = function(tx)
{
    let outcome = tx.outcome;
    let commentDetails = [];

    commentDetails.push("The channel **`" + tx.specification.channel + "`** claimed **`" + (outcome.channelChanges.channelBalanceChangeDrops / 1000000) + "`** XRP.");

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

    const response = await axios.post('https://xrpl.ws', {
        "method": "tx",
        "params": [
            {
                "transaction": hash,
                "binary": false
            }
        ]
    });

    response.data.result.sup = {};

    if (typeof response.data.result.date === 'number') {
        response.data.result.sup.date = rippleDateToReadable(response.data.result.date);
    } else if (typeof response.data.result.date === 'object') {
        response.data.result.sup.date = response.data.result.date;
    }

    if (typeof response.data.result.meta.delivered_amount === 'string') {
        response.data.result.sup.deliveredAmount = {
            value: response.data.result.meta.delivered_amount,
            currency: 'XRP'
        };
    } else if (typeof response.data.result.meta.delivered_amount === 'object') {
        response.data.result.sup.deliveredAmount = response.data.result.meta.delivered_amount;
    }

    console.log(util.inspect(response.data, false, null, true ));

    return response.data;
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

        console.log(accountNames);
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