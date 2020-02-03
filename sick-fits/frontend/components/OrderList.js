import React, { Component } from "react";
import PropTypes from "prop-types";
import { Query } from "react-apollo";
import { formatDistance } from "date-fns";
import gql from "graphql-tag";
import Link from "next/link";
import styled from "styled-components";
import formatMoney from "../lib/formatMoney";
import Error from "./ErrorMessage";
import OrderItemStyles from "./styles/OrderItemStyles";
import User from "./User";

const ORDERS_QUERY = gql`
  query ORDERS_QUERY {
    orders(orderBy: createdAt_DESC) {
      id
      total
      createdAt
      items {
        id
        title
        price
        description
        quantity
        image
        largeImage
      }
    }
  }
`;

const OrderUl = styled.ul`
  display: grid;
  grid-gap: 4rem;
  grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));
`;

class OrderList extends Component {
  render() {
    return (
      <User>
        {({ data: { me } }) => (
          <Query query={ORDERS_QUERY}>
            {({ data: { orders }, error, loading }) => {
              if (error) {
                return <Error error={error} />;
              }
              if (loading) {
                return <p>Loading...</p>;
              }
              return (
                <div>
                  <h2>You have {orders.length} orders</h2>
                  <OrderUl>
                    {orders.map(order => (
                      <OrderItemStyles key={order.id}>
                        <Link
                          href={{
                            pathname: "/order",
                            query: { id: order.id }
                          }}
                        >
                          <a>
                            <div className="order-meta">
                              <p>
                                {order.items.reduce(
                                  (a, b) => a + b.quantity,
                                  0
                                )}{" "}
                                items
                              </p>
                              <p>{order.items.length} Products</p>
                              <p>
                                {formatDistance(
                                  new Date(order.createdAt),
                                  new Date()
                                )}
                              </p>
                              <p>{formatMoney(order.total)}</p>
                            </div>
                            <div className="images">
                              {order.items.map(item => (
                                <img
                                  key={item.id}
                                  src={item.image}
                                  alt={item.title}
                                />
                              ))}
                            </div>
                          </a>
                        </Link>
                      </OrderItemStyles>
                    ))}
                  </OrderUl>
                </div>
              );
            }}
          </Query>
        )}
      </User>
    );
  }
}

export default OrderList;
