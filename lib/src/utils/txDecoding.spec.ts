// @ts-nocheck
/* eslint-disable */
import 'mocha';
import { expect } from 'chai';
import { TxBody } from '@cosmjs/proto-signing/build/codec/cosmos/tx/v1beta1/tx';
import { Any } from '@cosmjs/stargate/build/codec/google/protobuf/any';
import Long from 'long';
import Big from 'big.js';
import { TxDecoder, getTxBodyBytes } from './txDecoder';
import { Bytes } from './bytes/bytes';
import { Secp256k1KeyPair } from '../keypair/secp256k1';
import { CroNetwork } from '../core/cro';

describe('TxDecoder', function () {
    it('should throw on certain places', function () {
        const txDecoder = new TxDecoder();

        expect(() => {
            txDecoder.fromHex(
                '0A94010A91010A1C2F636F736D6F732E62616E6B2E763162657461312E4D736753656E6412710A2B7463726F31666D70726D30736A79366C7A396C6C7637726C746E307632617A7A7763777A766B326C73796E122B7463726F31373832676E39687A7161766563756B64617171636C76736E70636B346D747A3376777A70786C1A150A08626173657463726F120931303030303030303012690A500A460A1F2F636F736D6F732E63727970746F2E736563703235366B312E5075624B657912230A210359A154BA210C489DA46626A4D631C6F8A471A2FBDA342164DD5FC4A158901F2612040A02087F180412150A100A08626173657463726F12043130303010904E1A40E812FBA1D50115CDDD534C79CDD5AD312182696CABB76F05B82B9557EE1A2842A5579B363F0A5F2E487F7228A81FBF81E125E58F264A29DA07',
            );
        }).to.throw('Error decoding provided transaction hex.');

        expect(() => {
            txDecoder.fromHex('');
        }).to.throw('Received malformed transaction hex.');

        expect(() => {
            txDecoder.fromHex('INVALID_HEX');
        }).to.throw('Invalid Hex provided.');
    });
    it('should decode correctly on empty auth_info and signatures', function () {
        const txDecoder = new TxDecoder();

        expect(
            txDecoder
                .fromHex(
                    '0a540a520a1b2f636f736d6f732e676f762e763162657461312e4d7367566f7465123308e0f64b122b7463726f3138346c7461326c7379753437767779703265387a6d746361336b35797138357036633476703318021200',
                )
                .toCosmosJSON(),
        ).to.equal(JSON.stringify(emptyAuthInfoTxObject));
    });

    it('should throw on empty messages array', function () {
        const txDecoder = new TxDecoder();
        const txDecoded = txDecoder.fromHex(
            '0A94010A91010A1C2F636F736D6F732E62616E6B2E763162657461312E4D736753656E6412710A2B7463726F31666D70726D30736A79366C7A396C6C7637726C746E307632617A7A7763777A766B326C73796E122B7463726F31373832676E39687A7161766563756B64617171636C76736E70636B346D747A3376777A70786C1A150A08626173657463726F120931303030303030303012690A500A460A1F2F636F736D6F732E63727970746F2E736563703235366B312E5075624B657912230A210359A154BA210C489DA46626A4D631C6F8A471A2FBDA342164DD5FC4A158901F2612040A02087F180412150A100A08626173657463726F12043130303010904E1A40E812FBA1D50115CDDD534C7675B838E6CE7169CDD5AD312182696CABB76F05B82B9557EE1A2842A5579B363F0A5F2E487F7228A81FBF81E125E58F264A29DA07',
        );
        // @ts-ignore
        txDecoded.libDecodedTxBody = TxBody.fromPartial({
            timeoutHeight: Long.fromNumber(0),
            messages: [
                Any.fromPartial({
                    typeUrl: '',
                    value: new Uint8Array(),
                }),
            ],
        });

        expect(() => {
            txDecoder.toCosmosJSON();
        }).to.throw('Missing type_url in Any');
    });

    it('should decode and re-encode Cosmos JSON tx correctly', function () {
        const signableTx = TxDecoder.fromCosmosJSON(JSON.stringify(cosmosTxObject), CroNetwork.Testnet);
        signableTx.setSignerAccountNumberAtIndex(0, new Big(179));
        const keyPair = Secp256k1KeyPair.fromPrivKey(
            Bytes.fromHexString('60300d38b56590fe22439d3eaa77d494ba9b5c93d2cec0b3639bdd51c3e3fa49'),
        );
        const signature = keyPair.sign(signableTx.toSignDocumentHash(0));
        signableTx.setSignature(0, signature);
        const encodedHex = signableTx.toSigned().encode().toHexString();
        const txDecoder = new TxDecoder();
        expect(txDecoder.fromHex(encodedHex).toCosmosJSON()).to.equal(JSON.stringify(cosmosTxObject));
    });

    it('should decode and re-encode Cosmos JSON tx correctly for LEGACY MODE', function () {
        const signableTx = TxDecoder.fromCosmosJSON(JSON.stringify(cosmosTxObject_Legacy), CroNetwork.Testnet);
        signableTx.setSignerAccountNumberAtIndex(0, new Big(179));
        const keyPair = Secp256k1KeyPair.fromPrivKey(
            Bytes.fromHexString('60300d38b56590fe22439d3eaa77d494ba9b5c93d2cec0b3639bdd51c3e3fa49'),
        );
        const signature = keyPair.sign(signableTx.toSignDocumentHash(0));
        signableTx.setSignature(0, signature);
        const encodedHex = signableTx.toSigned().encode().toHexString();
        const txDecoder = new TxDecoder();
        cosmosTxObject_Legacy.tx.auth_info.fee.amount = [{ denom: 'basetcro', amount: '1000000000000' }];
        expect(txDecoder.fromHex(encodedHex).toCosmosJSON()).to.equal(JSON.stringify(cosmosTxObject_Legacy));
    });
    it('should decode the transaction correctly', function () {
        const txDecoder = new TxDecoder();
        expect(
            txDecoder
                .fromHex(
                    '0a9b010a8c010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64126c0a2b7463726f31667a63727a61336a3466323637376a667578756c6b6733337a36383532717371733868783530122b7463726f31667a63727a61336a3466323637376a667578756c6b6733337a363835327173717338687835301a100a08626173657463726f120431303030120a616d696e6f2074657374126b0a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a210223c9395d41013e6470c8d27da8b75850554faada3fe3e812660cbdf4534a85d712040a020801180112170a110a08626173657463726f1205313030303010a08d061a4031f4c489b98decb367972790747139c7706f54aafd9e5a3a5ada4f72c7b017646f1eb5cb1bdf518603d5d8991466a13c3f68844dcd9b168b5d4ca0cb5ea514bc',
                )
                .toCosmosJSON(),
        ).equal(JSON.stringify(cosmosTxObject));
    });
    it('should decode IBC MsgTransfer transaction correctly', function () {
        const txDecoder = new TxDecoder();
        expect(
            txDecoder
                .fromHex(
                    '0ac7010ac4010a292f6962632e6170706c69636174696f6e732e7472616e736665722e76312e4d73675472616e736665721296010a087472616e73666572120a6368616e6e656c2d33331a100a08626173657463726f120431323334222b7463726f313573667570643236737036716633376c6c3571367875663333306b37646639746e76727168742a2d636f736d6f7331767734756361656167746475763565703473613935653361717a7170736b356d6564613038633206080010e3a36838c4a7e1daaafaeabe1612580a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a2103fd0d560b6c4aa1ca16721d039a192867c3457e19dad553edb98e7ba88b159c2712040a0208011802120410c09a0c1a40f1032ff3d1b53682d8038e4a06d7c1fadf17858a619e32cc3fa5f9463b35c6194f7ebff606dbe142fe63f3d978da2e4372831ea96faf94c80153416667bcd321',
                )
                .toCosmosJSON(),
        ).equal(JSON.stringify(ibc.msgTransfer));
    });
    
    it('should throw when no/invalid input provided to .fromCosmosJSON()', function () {
        // empty string
        expect(() => TxDecoder.fromCosmosJSON('')).to.throw('Error decoding provided Tx JSON.');

        // invalid JSON
        expect(() => TxDecoder.fromCosmosJSON('anInvalidString')).to.throw('Provided JSON is not valid.');

        // invalid JSON - Invalid Tx JSON
        expect(() => TxDecoder.fromCosmosJSON(JSON.stringify(undefinedAuthInfoTxObject))).to.throw(
            'Provided Tx JSON is not valid.',
        );

        // invalid JSON - Empty authinfo
        expect(() => TxDecoder.fromCosmosJSON(JSON.stringify(multipleFeeAmountsTx))).to.throw(
            'Invalid fee amount provided.',
        );

        // invalid txBody
        expect(() => getTxBodyBytes(undefined)).to.throw('Error getting TxBody bytes');
    });
});
let ibc = {
    msgTransfer: { "tx": { "body": { "messages": [{ "@type": "/ibc.applications.transfer.v1.MsgTransfer", "source_port": "transfer", "source_channel": "channel-33", "token": { "denom": "basetcro", "amount": "1234" }, "sender": "tcro15sfupd26sp6qf37ll5q6xuf330k7df9tnvrqht", "receiver": "cosmos1vw4ucaeagtduv5ep4sa95e3aqzqpsk5meda08c", "timeout_height": { "revision_number": "0", "revision_height": "1708515" }, "timeout_timestamp": "1620640362229420996" }], "memo": "", "timeout_height": "0", "extension_options": [], "non_critical_extension_options": [] }, "auth_info": { "signer_infos": [{ "public_key": { "@type": "/cosmos.crypto.secp256k1.PubKey", "key": "A/0NVgtsSqHKFnIdA5oZKGfDRX4Z2tVT7bmOe6iLFZwn" }, "mode_info": { "single": { "mode": "SIGN_MODE_DIRECT" } }, "sequence": "2" }], "fee": { "amount": [], "gas_limit": "200000", "payer": "", "granter": "" } }, "signatures": ["8QMv89G1NoLYA45KBtfB+t8XhYphnjLMP6X5Rjs1xhlPfr/2BtvhQv5j89l42i5DcoMeqW+vlMgBU0FmZ7zTIQ=="] } }
}
let cosmosTxObject = {
    tx: {
        body: {
            messages: [
                {
                    '@type': '/cosmos.bank.v1beta1.MsgSend',
                    amount: [{ denom: 'basetcro', amount: '1000' }],
                    from_address: 'tcro1fzcrza3j4f2677jfuxulkg33z6852qsqs8hx50',
                    to_address: 'tcro1fzcrza3j4f2677jfuxulkg33z6852qsqs8hx50',
                },
            ],
            memo: 'amino test',
            timeout_height: '0',
            extension_options: [],
            non_critical_extension_options: [],
        },
        auth_info: {
            signer_infos: [
                {
                    public_key: {
                        '@type': '/cosmos.crypto.secp256k1.PubKey',
                        key: 'AiPJOV1BAT5kcMjSfai3WFBVT6raP+PoEmYMvfRTSoXX',
                    },
                    mode_info: { single: { mode: 'SIGN_MODE_DIRECT' } },
                    sequence: '1',
                },
            ],
            fee: { amount: [{ denom: 'basetcro', amount: '10000' }], gas_limit: '100000', payer: '', granter: '' },
        },
        signatures: ['MfTEibmN7LNnlyeQdHE5x3BvVKr9nlo6WtpPcsewF2RvHrXLG99RhgPV2JkUZqE8P2iETc2bFotdTKDLXqUUvA=='],
    },
};

let cosmosTxObject_Legacy = JSON.parse(JSON.stringify(cosmosTxObject));
cosmosTxObject_Legacy.tx.auth_info.signer_infos[0].mode_info.single.mode = 'SIGN_MODE_LEGACY_AMINO_JSON';
cosmosTxObject_Legacy.tx.auth_info.fee.amount = [{ denom: 'tcro', amount: '10000' }];
cosmosTxObject_Legacy.tx.signatures[0] =
    'd/GcumOqYkUFSxKz+VNgsDnsPuAUkIq0Oy7DLScbpMV3gd7RGkA36my33ixzKr0mdBUqmHFqok98glxzjJxpyg==';

let emptyAuthInfoTxObject = { "tx": { "body": { "messages": [{ "@type": "/cosmos.gov.v1beta1.MsgVote", "proposal_id": "1244000", "voter": "tcro184lta2lsyu47vwyp2e8zmtca3k5yq85p6c4vp3", "option": 2 }], "memo": "", "timeout_height": "0", "extension_options": [], "non_critical_extension_options": [] }, "auth_info": { "signer_infos": [] }, "signatures": [] } };

let undefinedAuthInfoTxObject = {
    tx: {
        body: {
            messages: [
                {
                    '@type': '/cosmos.gov.v1beta1.MsgVote',
                    proposal_id: { low: 1244000, high: 0, unsigned: true },
                    voter: 'tcro184lta2lsyu47vwyp2e8zmtca3k5yq85p6c4vp3',
                    option: 2,
                },
            ],
            memo: '',
            timeout_height: '0',
            extension_options: [],
            non_critical_extension_options: [],
        },
        auth_info: {},
        signatures: [],
    },
};

let multipleFeeAmountsTx = JSON.parse(JSON.stringify(cosmosTxObject));
multipleFeeAmountsTx.tx.auth_info.fee.amount = [
    { denom: 'tcro', amount: '10000' },
    { denom: 'tcro', amount: '10000' },
];
