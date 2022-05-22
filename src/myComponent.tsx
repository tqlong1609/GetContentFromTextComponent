import { Container, Grid, GridItem, Box, Center, Text, Button } from "@chakra-ui/react";
import { useIntl } from "react-intl";
import { useEffect } from 'react'
import SectionTitle from "src/components/SectionTitle";
import CartInfo from "src/components/Cart/CartInfo";
import CartItem from "src/components/Cart/CartItem";
import Fold from "src/components/Banner/Fold";
import { GiShoppingCart } from 'react-icons/gi'

// redux toolkit
import { selectCart } from "src/features/Cart/cartSlice";
import { useAppSelector } from "src/app/hooks";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { resetCouponsApplied } from "src/features/Promotion/promotionSlice";

function Cart() {
  const { list } = useAppSelector(selectCart);
  const intl = useIntl();
  const router = useRouter()
  const number1 = 123
  const number2 = 123

  return (
    <>
      <Box bg="sub.100" pb="40px">
        <Fold />
        <Container maxW={"6xl"}>
          <SectionTitle
            // content={`Giỏ hàng (${list.length})`}
            content={
              #{`Cart (${number1})`}
            }
          showAllButton={false}
          />
          <Grid templateColumns="repeat(3, 1fr)" gap={6}>
            <GridItem colSpan={{ base: 3, md: 2 }}>
              {list.length > 0 ? <Box bg="#fff" p={{ base: "10px", md: "53px 35px" }}>
                {list.map((product, index) => (
                  <CartItem key={index} {...product} />
                ))}
              </Box> :
                <Center
                  bg="#fff"
                  h={{ base: "200px", md: "480px" }}
                  p={{ base: "10px", md: "53px 35px" }}>
                  <Box alignItems="center" display="flex" flexDirection="column" >
                    <GiShoppingCart size="100px" color="#BABBBD" />
                    <Text fontWeight="bold" color="#BABBBD" fontSize="20px">
                      %{"Empty cart"}
                    </Text>
                    <Button
                      onClick={() => router.push('/')}
                      variant="outline" mt="10px" bg="#FFCB47" px="25px">
                      %{"Update"}
                    </Button>
                  </Box>
                </Center>}
            </GridItem>
            <GridItem colSpan={{ base: 3, md: 1 }}>
              <CartInfo
                showDetailCart={false}
                errorMess={
                  #{"Chicken"}
                }
                setErrorMess={() => { }}
              />
            </GridItem>
          </Grid>

          {/* {sectionList.map((section, index) => (
            <Box key={index}>
              <SectionTitle
                content={section.title}
                customStyles={{ mt: "46px", mb: "23px" }}
              />
              <Grid templateColumns="repeat(5, 1fr)" gap="18px">
                {section.productList.map((product) => (
                  <GridItem colSpan={1} key={product.id}>
                    <Product {...product} />
                  </GridItem>
                ))}
              </Grid>
            </Box>
          ))} */}
        </Container>
      </Box>
    </>
  );
}

export default Cart;
