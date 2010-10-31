class PagesController < ApplicationController
  def home
      @title = ""
  end

  def about
      @title = "about"
  end

  def test
      @title = "Test Page"
  end

end
