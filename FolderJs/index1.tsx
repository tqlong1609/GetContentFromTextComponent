import {
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Alert,
  AlertIcon,
  CloseButton,
  useToast,
  Slide,
} from "@chakra-ui/react";

import React, { useState, useEffect } from "react";

import Fold from "src/components/Banner/Fold";
import CartInfo from "src/components/Cart/CartInfo";
import Methods from "./Methods";

// redux toolkit
import { resetCart, selectCart } from "src/features/Cart/cartSlice";
import { selectAddress } from "src/features/Address/addressSlice";
// import { addOrder } from "src/features/Checkout/checkoutSlice";
import { useAppDispatch, useAppSelector } from "src/app/hooks";

import { createOrder, Order, repayment } from "src/common/service/orderService";
import { useRouter } from "next/router";
import { isMobile } from "react-device-detect";
import { BIPBIPResponse } from "src/common/service/types";
import axiosClient from "src/common/api/request";

import { CHANNEL } from "src/common/config";
import { selectPromotion } from "src/features/Promotion/promotionSlice";
import { selectStation } from "src/features/Station/stationSlice";
export const ERROR_DELIVERY = "Xin hãy nhập địa chỉ giao hàng";

function ShippingAndPayment() {
  const { list } = useAppSelector(selectCart);
  const { list: customerInfoList, selected } = useAppSelector(selectAddress);
  const { applyCoupons, infoCoupon } = useAppSelector(selectPromotion);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const companyNameRef = React.useRef<string | null>(null);
  const addressRef = React.useRef<string | null>(null);
  const emailRef = React.useRef<string | null>(null);
  const taxCodeRef = React.useRef<string | null>(null);
  const { dist: distStation, station } = useAppSelector(selectStation);

  const [pickUpStation, setPickUpStation] = useState<{
    id: string;
    name?: string;
    address?: string;
  }>({ id: "home", name: "", address: "" });

  const [timeSlots, setTimeSlots] =
    useState<{ minPromise: string; maxPromise: string; id: string }>();

  const [fcChildStation, setFcChildStation] = useState<string>();

  const [isError, setIsError] = useState<boolean>(false);
  const [errorMess, setErrorMess] = useState<string>("");

  const getFcStationId = async () => {
    const data: BIPBIPResponse<
      {
        id: string;
      }[]
    > = await axiosClient.get(
      `/ms-station/api/stations/child-of-station?platform_key=centralweb&function=FC&parent_id=${distStation?.station_id}&is_active=true`
    );

    if (data.code === "success") {
      setFcChildStation(data.data[0].id);
    }
  };

  useEffect(() => {
    if (distStation?.station_id) {
      getFcStationId();
    } else {
      throw new Error("station_id not found");
    }
  }, [distStation]);

  const isDeliveryAddressValid = (): boolean => {
    if (pickUpStation.id === "home") {
      if (
        selected.fullAddress &&
        selected.city.short_id &&
        selected.dist.short_id &&
        selected.ward.short_id &&
        selected.address
      ) {
        return true;
      }
      return false;
    }
    return true;
  };

  const getDataPayment = () => {
    let deliveryType;
    let maxPromise;
    let minPromise;
    let deliveryAddress;
    let deliveryAddressDetail;
    let customerPickupStationId;
    let talon_coupon_id;
    let talon_coupon_code;
    let talon_coupon_discount;
    let promotion_discount;

    if (pickUpStation.id === "home") {
      deliveryType = "home_delivery";
      maxPromise = undefined;
      minPromise = undefined;
      deliveryAddress = selected.fullAddress;
      deliveryAddressDetail = {
        city: selected.city.short_id,
        district: selected.dist.short_id,
        ward: selected.ward.short_id,
        address: selected.address,
      };
      customerPickupStationId = station?.station_functions.some(
        (item: { key: string }) => item.key === "PP"
      )
        ? distStation?.station_id
        : fcChildStation;
    } else {
      deliveryType = "station_delivery";
      maxPromise = timeSlots?.maxPromise;
      minPromise = timeSlots?.minPromise;
      customerPickupStationId = pickUpStation.id;
      deliveryAddress = undefined;
      deliveryAddressDetail = undefined;
    }

    if (applyCoupons.validCouponCodes.length > 0) {
      const coupon_code = applyCoupons.validCouponCodes[0];
      talon_coupon_code = coupon_code;
      talon_coupon_id = infoCoupon.find(
        (item) => item.value === coupon_code
      )?.id;
      talon_coupon_discount = applyCoupons.totalDiscount;
      promotion_discount = applyCoupons.totalDiscount;
    }

    return {
      customer_id: localStorage.getItem("userId"),
      customer_pickup_station_id: customerPickupStationId,
      delivery_address: deliveryAddress,
      delivery_address_detail: deliveryAddressDetail,
      delivery_type: deliveryType,
      einvoice_info: {
        company: companyNameRef.current,
        address: addressRef.current,
        tax_code: taxCodeRef.current,
        email: emailRef.current,
      },
      fee: selected.deliveryFee,
      max_promise: maxPromise,
      min_promise: minPromise,
      timeslot_fee: 0,
      timeslot_id: timeSlots?.id,
      order_items: list.map((item) => {
        return {
          sku: item.sku_id,
          ordered_unit_price: item.normal_price,
          ordered_quantity: item.quantity,
          special_instruction: item.note,
        };
      }),
      payment_method: paymentMethod,
      platform_key: "centralweb",
      remark: " ",
      channel: CHANNEL,
      talon_coupon_id,
      talon_coupon_code,
      talon_coupon_discount,
      promotion_discount,
    };
  };

  const handleCheckout = async () => {
    if (isDeliveryAddressValid()) {
      setLoading(true);
      const data = getDataPayment();
      try {
        const response = await createOrder(data);
        if (response?.code === "success") {
          // const payload = response.data;
          // dispatch(addOrder(payload));
          // resetCart();
          dispatch(resetCart());
          const dataResponse = (response as BIPBIPResponse<Order[] | Order>)
            .data;
          const data = Array.isArray(dataResponse)
            ? dataResponse[0]
            : dataResponse;
          if (paymentMethod === "cod") {
            const query = {
              order: data.order_number,
              fullAddress: data.delivery_address,
              phone: customerInfoList[0].phone,
              name: selected.firstName,
              paymentMethod,
              orderId: data.id,
              // deliveryType,
              // maxPromise,
              // minPromise,
              // stationName: pickUpStation?.name,
              // stationAddress: pickUpStation?.address,
            };
            handelOrderSuccess(query);
          }

          if (paymentMethod === "vnpay") {
            const { redirect_to } = data as any;
            router.replace(redirect_to);
          }

          if (paymentMethod === "momo_aio") {
            handelPaymentMoMo(data);
          }
        }
      } catch (error: any) {
        setIsError(true);
        setErrorMess(error.message);
      } finally {
        setLoading(false);
      }
    } else {
      setIsError(true);
      setErrorMess(ERROR_DELIVERY);
    }
  };

  // const handelPaymentVnpay = async (orderNumber: string) => {
  //   const data = {
  //     order_number: orderNumber,
  //     payment_method: "vnpay",
  //     phone_number: "",
  //     momo_token: "",
  //   };
  //   const response = await repayment(data);
  //   if (response?.code === "success") {
  //     console.log("handelPaymentVnpay -->", response);
  //     const { redirect_to } = response.data;
  //     router.replace(redirect_to);
  //   }
  //   if (response.code === "error") {
  //     setIsError(true);
  //     setErrorMess(response?.message);
  //   }
  //   setLoading(false);
  // };

  const handelPaymentMoMo = async (data: any) => {
    const query = {
      order_number: data.order_info.order_number,
      payment_method: data.order_info.payment_method,
    };
    const response = await repayment(query);
    if (response.code === "success") {
      const { momo_aio_deeplink, momo_aio_pay_url } = response.data;
      if (isMobile && momo_aio_deeplink) {
        router.replace(momo_aio_deeplink);
      } else {
        router.replace(momo_aio_pay_url);
      }
      setLoading(false);
    }
  };

  const handelOrderSuccess = (obj: {}) => {
    const query = {
      orderId: "",
      fullAddress: selected?.fullAddress,
      phone: customerInfoList[0]?.phone,
      ...obj,
    };

    router.push({
      pathname: "/checkout/order-status",
      query,
    });
    setLoading(false);
  };

  const onChangeInputGroup = (
    companyName: string,
    address: string,
    email: string,
    taxCode: string
  ) => {
    companyNameRef.current = companyName;
    addressRef.current = address;
    emailRef.current = email;
    taxCodeRef.current = taxCode;
  };

  return (
    <Box bg="sub.100" pb="40px">
      <Fold />
      <Container maxW={"6xl"}>
        <Grid templateColumns="repeat(3, 1fr)" gap={6} rowGap={1}>
          <GridItem
            colSpan={{ base: 3, md: 1 }}
            sx={{ order: { base: 1, md: 2 } }}
          >
            <Accordion allowToggle border="#fff" mt="47px">
              <AccordionItem
                sx={{
                  "@media screen and (min-width: 768px)": {
                    "& .chakra-collapse": {
                      display: "block !important",
                      overflow: "unset !important",
                      opacity: "unset !important",
                      height: "unset !important",
                    },
                  },
                }}
              >
                <AccordionButton
                  display={{ base: "block", md: "none" }}
                  w="100%"
                  p="0"
                  justifyContent="center"
                  _focus={{ border: "none" }}
                  _hover={{ bg: "#fff" }}
                >
                  <Box w="100%" bg="second.600" color="white" lineHeight="40px">
                    {intl.formatMessage({
                      id: "infoOrder",
                      defaultMessage: "Xem thông tin đơn hàng",
                      description: "Info 123",
                    })}
                    <AccordionIcon />
                  </Box>
                </AccordionButton>
                <AccordionPanel p="5" mt={{ base: 0, md: "5px" }}>
                  <CartInfo
                    customStyles={{ mt: 0 }}
                    showButton={false}
                    errorMess={errorMess}
                    setErrorMess={setErrorMess}
                  />
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </GridItem>

          <GridItem
            colSpan={{ base: 3, md: 2 }}
            sx={{ order: { base: 2, md: 1 } }}
          >
            <Methods
              onPaymentChange={setPaymentMethod}
              onShippingChange={setPickUpStation}
              onTimeSlotsChange={setTimeSlots}
              onChangeInputGroup={onChangeInputGroup}
            />

            <Button
              onClick={handleCheckout}
              bg="main.300"
              w="100%"
              h="54px"
              isLoading={loading}
            >
              Mua hàng (7)
            </Button>
          </GridItem>
        </Grid>

        <Slide direction="top" in={isError} style={{ zIndex: 1401 }}>
          <Alert
            status="error"
            ml="50%"
            transform="translateX(-50%)"
            minW="375px"
            maxW="450px"
            h="100px"
          >
            <AlertIcon />
            {errorMess || "Error"}
            <CloseButton
              position="absolute"
              right="8px"
              top="8px"
              onClick={() => setIsError(false)}
            />
          </Alert>
        </Slide>
      </Container>
    </Box>
  );
}

export default ShippingAndPayment;
