import ItemComponent from "../components/Item";
import { shallow } from "enzyme";
import toJSON from "enzyme-to-json";

const fakeItem = {
  id: "ABC123",
  title: "A cool item",
  price: 5000,
  description: "This item is really cool",
  image: "dog.jpg",
  largeImage: "largedog.jpg"
};

describe("<Item />", () => {
  it("renders and matches the snapshot", () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);
    expect(toJSON(wrapper)).toMatchSnapshot();
  });
  //   it("renders and displays propertly", () => {
  //     const wrapper = shallow(<ItemComponent item={fakeItem} />);
  //     const PriceTag = wrapper.find("PriceTag");
  //     expect(PriceTag.children().text()).toBe("$50");
  //     expect(wrapper.find("Title a").text()).toBe(fakeItem.title);
  //     const img = wrapper.find("img");
  //     expect(img.props().src).toBe(fakeItem.image);
  //     expect(img.props().alt).toBe(fakeItem.title);
  //   });

  //   it("renders out the buttons propertly", () => {
  //     const wrapper = shallow(<ItemComponent item={fakeItem} />);
  //     const buttonList = wrapper.find(".buttonList");
  //     expect(buttonList.children()).toHaveLength(3);
  //     expect(buttonList.find("Link")).toHaveLength(1);
  //   });
});
