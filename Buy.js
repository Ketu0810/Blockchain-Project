/*eslint-disable*/
import React, { useState, useEffect, useRef } from 'react';
import IndexNavbar from 'components/Navbars/IndexNavbar.js';
import Footer from 'components/Footers/Footer.js';
import { Link } from 'react-router-dom';
// Blockchain
import Web3 from 'web3';
import { sequence } from '0xsequence';
import { NetRent } from '../constants/Constants.js';
import { NetRentABI } from '../constants/Constants.js';
import { BrandCollection } from '../constants/Constants.js';
import { BrandCollectionABI } from '../constants/Constants.js';
import { BrandWarranty } from '../constants/Constants.js';
import { BrandWarrantyABI } from '../constants/Constants.js';
import { BrandInvoice } from '../constants/Constants.js';
import { BrandInvoiceABI } from '../constants/Constants.js';
import Loading from 'assets/img/loading.gif';
import { useIPFS } from '../contexts/IPFS.js';
import { maxHeight } from 'tailwindcss/defaultTheme.js';

const network = 'mumbai';
sequence.initWallet(network);

export default function Buy(props) {
  const { id } = props.match.params;
  const { IPFSuploading, IPFSerror, IPFSupload, invoiceUpload } = useIPFS();

  useEffect(async () => {
    await connectWallet();
    await getProductDetails();
  }, []);

  const [showNFT, setShowNFT] = React.useState(false);
  const [openTab, setOpenTab] = React.useState(1);
  const [loading, setLoading] = useState(false);
  const [address, setUserAddress] = useState();
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [product, setProduct] = useState(null);
  const [productObject, setProductObject] = useState(null);
  const [nftObject, setNftObject] = useState(null);
  const [warrantyObject, setWarrantyObject] = useState(null);
  const [invoiceURI, setInvoiceURI] = useState('');

  const connectWallet = async () => {
    setLoading(true);
    console.log('== Connecting Wallet');
    const wallet = sequence.getWallet();
    if (wallet.isConnected()) {
      const walletAddress = await wallet.getAddress();
      const provider = await wallet.getProvider();
      setUserAddress(walletAddress);
      setConnected(true);
      setProvider(provider);
    } else {
      wallet.openWallet();
      const connection = await wallet.connect({
        app: 'NetRent',
        authorize: true,
        // And pass settings if you would like to customize further
        settings: {
          theme: 'light',
          bannerUrl:
            'https://www.emotivebrand.com/wp-content/uploads/2016/09/tumblr_o05v3eZmyT1ugn1wu_og_1280-1080x675.png', // 3:1 aspect ratio, 1200x400 works best
          includedPaymentProviders: ['moonpay', 'ramp'],
          defaultFundingCurrency: 'matic',
          lockFundingCurrencyToDefault: false,
        },
      });
    }
  };

  const makePayment = async () => {
    generateInvoice();
  };

  const getProductDetails = async () => {
    // Contract Integration
    console.log('== Loading Product Details');
    const wallet = sequence.getWallet();
    const provider = await wallet.getProvider();
    const web3 = new Web3(provider);
    const netRent = new web3.eth.Contract(NetRentABI, NetRent);
    console.log(netRent);
    console.log('Tasa');
    const product = await netRent.methods.items(id).call();
    console.log('Product', product);
    setProduct(product);
    const productObj = await parseURL(product.productURI);
    setProductObject(productObj);
    console.log(productObj);
    await getNFTDetails(product.itemNftID);
    await getWarrantyDetails(product.itemWarrantyCardID);
  };

  const getNFTDetails = async (tokenID) => {
    // Contract Integration
    console.log('== Loading NFT Details');
    const wallet = sequence.getWallet();
    const provider = await wallet.getProvider();

    const web3 = new Web3(provider);
    const brandCollection = new web3.eth.Contract(
      BrandCollectionABI,
      BrandCollection
    );
    console.log(brandCollection);
    const nft = await brandCollection.methods.uri(tokenID).call();
    console.log(nft);
    const nftObj = await parseURL(nft);
    setNftObject(nftObj);
    console.log(nftObj);
  };

  const getWarrantyDetails = async (tokenID) => {
    // Contract Integration
    console.log('== Loading Warranty Details');
    const wallet = sequence.getWallet();
    const provider = await wallet.getProvider();

    const web3 = new Web3(provider);
    const brandWarranty = new web3.eth.Contract(
      BrandWarrantyABI,
      BrandWarranty
    );
    console.log(brandWarranty);
    const warranty = await brandWarranty.methods.uri(tokenID).call();
    console.log(warranty);
    const warrantyObj = await parseURL(warranty);
    setWarrantyObject(warrantyObj);
    console.log(warrantyObj);
    setLoading(false);
  };

  const uploadMetadata = async (name, totalCost) => {
    console.log('== Uploading Metadata == ');
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;
    console.log(today);
    console.log(name);
    console.log(totalCost);

    const metadataUrl = await invoiceUpload({
      name: name,
      today: today,
      totalCost: totalCost,
    });
    console.log(metadataUrl);

    return metadataUrl;
  };

  const parseURL = async (url) => {
    const data = await fetch(url);
    const json = await data.json();
    console.log(json);
    return json;
  };

  const getURLLink = (url) => {
    let image = url.toString();
    return 'https://gateway.ipfscdn.io/ipfs/' + image.slice(7);
  };

  const generateInvoice = async () => {
    setLoading(true);
    console.log(productObject);
    let invoiceURL = await uploadMetadata(productObject.name, product.cost, '');

    console.log('Invoice URI : ', invoiceURL);
    setInvoiceURI(invoiceURL);
    setLoading(false);
    setShowNFT(true);
  };
  if (loading) {
    return (
      <section>
        <div className='justify-center text-center flex flex-wrap'>
          <div className='w-full md:w-6/12'>
            <img alt='...' className='justify-center' src={Loading} />
          </div>
        </div>
      </section>
    );
  } else {
    return (
      <>
        <IndexNavbar fixed />
        <br />
        <br />

        {showNFT ? (
          <div className='mt-6 justify-center items-center flex overflow-x-hidden'>
            <div className='relative w-auto my-6 mx-auto max-w-sm'>
              {/*content*/}
              <div className='border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none'>
                {/*body*/}

                <div class='relative p-6 flex-auto'>
                  <div className='relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0'>
                    <div className='rounded-t bg-white mb-0 px-6 py-6'>
                      <div className='text-center flex justify-between'>
                        <h6 className='text-blueGray-700 text-xl font-bold'>
                          Congratulations !! You received the product NFT 🎊
                        </h6>
                      </div>
                    </div>
                    <div className='flex-auto px-4 lg:px-10 py-10 pt-0'>
                      <div className='flex flex-wrap justify-center'>
                        <div className='w-3/12 sm:w-4/12 px-4'>
                          <img
                            src={getURLLink(nftObject.image)}
                            alt='...'
                            className='rounded max-w-full h-auto align-middle border-none'
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='mb-0 px-6 py-0'>
                    <h6 className='text-sm font-bold'>
                      <a href={invoiceURI} clickable target='_blank'>
                        Check Invoice Details
                      </a>
                    </h6>
                  </div>
                </div>

                {/*footer*/}
              </div>
            </div>
          </div>
        ) : (
          <section className='items-center flex h-screen max-h-860-px'>
            {/* LEFT SIDE */}
            {productObject != null &&
              nftObject != null &&
              warrantyObject != null && (
                <div className='w-full lg:w-8/12 px-4'>
                  <div className='flex flex-wrap'>
                    <div className='w-full'>
                      <div className='relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded'>
                        <div className='px-4 py-5 flex-auto'>
                          <div className='tab-content tab-space'>
                            <div
                              className={openTab === 1 ? 'block' : 'hidden'}
                              id='link1'
                            >
                              <div className='flex flex-wrap justify-center'>
                                <div className='w-3/12 sm:w-4/12 px-4'>
                                  <h6 className='text-xl font-normal leading-normal mt-0 mb-2 text-lightBlue-800'>
                                    {productObject.name}
                                  </h6>
                                  <img
                                    src={getURLLink(productObject.image)}
                                    alt='...'
                                    className='rounded align-middle border-none'
                                  />
                                </div>
                              </div>
                            </div>
                            <div
                              className={openTab === 2 ? 'block' : 'hidden'}
                              id='link2'
                            >
                              <div className='flex flex-wrap justify-center'>
                                <div className='w-3/12 sm:w-4/12 px-4'>
                                  <h6 className='text-xl font-normal leading-normal mt-0 mb-2 text-lightBlue-800'>
                                    NFT Version
                                  </h6>
                                  <img
                                    src={getURLLink(nftObject.image)}
                                    alt='...'
                                    style={{ maxHeight: '500px' }}
                                    className='rounded align-middle border-none max-w-860px'
                                  />
                                </div>
                              </div>
                            </div>
                            <div
                              className={openTab === 3 ? 'block' : 'hidden'}
                              id='link3'
                            >
                              <div className='flex flex-wrap justify-center'>
                                <div className='w-3/12 sm:w-4/12 px-4'>
                                  <h6 className='text-xl font-normal leading-normal mt-0 mb-2 text-lightBlue-800'>
                                    {warrantyObject.description}
                                  </h6>
                                  <img
                                    src={getURLLink(warrantyObject.image)}
                                    alt='...'
                                    className='rounded align-middle border-none'
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <ul
                        className='flex mb-0 list-none flex-wrap pt-3 pb-4 flex-row'
                        role='tablist'
                      >
                        <li className='-mb-px mr-2 last:mr-0 flex-auto text-center'>
                          <a
                            className={
                              'text-xs font-bold uppercase px-5 py-3 shadow-lg rounded block leading-normal ' +
                              (openTab === 1
                                ? 'text-white bg-lightBlue-600'
                                : 'text-lightBlue-600 bg-white')
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              setOpenTab(1);
                            }}
                            data-toggle='tab'
                            href='#link1'
                            role='tablist'
                          >
                            <i className='fas fa-space-shuttle text-base mr-1'></i>{' '}
                            Product
                          </a>
                        </li>
                        <li className='-mb-px mr-2 last:mr-0 flex-auto text-center'>
                          <a
                            className={
                              'text-xs font-bold uppercase px-5 py-3 shadow-lg rounded block leading-normal ' +
                              (openTab === 2
                                ? 'text-white bg-lightBlue-600'
                                : 'text-lightBlue-600 bg-white')
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              setOpenTab(2);
                            }}
                            data-toggle='tab'
                            href='#link2'
                            role='tablist'
                          >
                            <i className='fas fa-cog text-base mr-1'></i>
                            NFT Version
                          </a>
                        </li>
                        <li className='-mb-px mr-2 last:mr-0 flex-auto text-center'>
                          <a
                            className={
                              'text-xs font-bold uppercase px-5 py-3 shadow-lg rounded block leading-normal ' +
                              (openTab === 3
                                ? 'text-white bg-lightBlue-600'
                                : 'text-lightBlue-600 bg-white')
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              setOpenTab(3);
                            }}
                            data-toggle='tab'
                            href='#link3'
                            role='tablist'
                          >
                            <i className='fas fa-briefcase text-base mr-1'></i>{' '}
                            Subscription Card
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            {/* RIGHT SIDE */}
            {productObject != null &&
              nftObject != null &&
              warrantyObject != null && (
                <div className='w-full lg:w-6/12 px-6'>
                  <div className='bg-blueGray-100'>
                    {/* <div className=" flex flex-wrap"> */}
                    <div className='w-full md:w-12/12 px-12 md:px-4'>
                      <br />
                      <br />
                      <h2 className='font-semibold text-4xl'>
                        {productObject.name}
                      </h2>
                      By {product.seller}
                      <br />
                      Product ID : {product.itemID}
                      <br />
                      <br />
                      <p className='text-lg leading-relaxed  text-blueGray-500'>
                        {productObject.description}
                      </p>
                      <p className='text-lg leading-relaxed  text-blueGray-500'>
                        {warrantyObject.description}
                      </p>
                      <br />
                      <br />
                      <br />
                      <button
                        className='bg-lightBlue-600 text-white active:bg-blue-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150'
                        type='button'
                        onClick={() => makePayment()}
                      >
                        {product.cost / 1000000000000000000} MATIC | Buy Now
                      </button>
                      <br />
                      <br />
                    </div>

                    {/* </div> */}
                  </div>
                </div>
              )}
          </section>
        )}
        <Footer />
      </>
    );
  }
}
